import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  apiMe,
  apiNonce,
  apiLogout,
  apiVerify,
  type ApiMeResponse,
} from "@/lib/apiClient";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { formatAuthConnectError } from "@/app/auth/connectErrors";
import {
  enablePolkadotExtension,
  getPolkadotAccounts,
  signPolkadotMessage,
} from "@/lib/polkadotExtension";

type AuthState = {
  enabled: boolean;
  loading: boolean;
  authenticated: boolean;
  address: string | null;
  eligible: boolean;
  gateReason?: string;
  lastError: string | null;
};

type AuthActions = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<ApiMeResponse | null>;
};

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "vortex:auth:selectedAddress";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const enabled = SIM_AUTH_ENABLED;
  const [loading, setLoading] = useState<boolean>(enabled);
  const [authenticated, setAuthenticated] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);
  const [gateReason, setGateReason] = useState<string | undefined>(undefined);
  const [lastSelectedAddress, setLastSelectedAddress] = useState<string | null>(
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const sessionRevision = useRef(0);
  const changingSession = useRef(false);

  const refreshSession =
    useCallback(async (): Promise<ApiMeResponse | null> => {
      if (!enabled) return null;
      const revision = ++sessionRevision.current;
      setLoading(true);
      setLastError(null);
      try {
        const next = await apiMe();
        if (revision !== sessionRevision.current) return null;
        if (next.authenticated) {
          setAuthenticated(true);
          setAddress(next.address);
          setEligible(next.gate.eligible);
          setGateReason(next.gate.eligible ? undefined : next.gate.reason);
        } else {
          setAuthenticated(false);
          setAddress(null);
          setEligible(false);
          setGateReason(undefined);
        }
        return next;
      } catch (error) {
        if (revision !== sessionRevision.current) return null;
        setLastError(
          formatAuthConnectError({ message: (error as Error).message }),
        );
        return null;
      } finally {
        if (revision === sessionRevision.current) setLoading(false);
      }
    }, [enabled]);

  const refresh = useCallback(() => {
    if (changingSession.current) return Promise.resolve(null);
    return refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!enabled || changingSession.current) return;
    changingSession.current = true;
    sessionRevision.current++;
    setLastError(null);
    setLoading(true);
    try {
      const ok = await enablePolkadotExtension("Vortex");
      if (!ok) {
        setLastError(
          "Polkadot extension not found or not enabled (or permission was denied).",
        );
        return;
      }
      const list = await getPolkadotAccounts();
      if (!list.length) {
        setLastError("No accounts found in the Polkadot extension.");
        return;
      }
      const candidate =
        (lastSelectedAddress &&
          list.find((a) => a.address === lastSelectedAddress)?.address) ||
        list[0].address;

      const { nonce } = await apiNonce(candidate);
      const signature = await signPolkadotMessage({
        address: candidate,
        message: nonce,
      });
      await apiVerify({ address: candidate, nonce, signature });

      setLastSelectedAddress(candidate);
      try {
        localStorage.setItem(STORAGE_KEY, candidate);
      } catch {
        // ignore
      }

      const next = await refreshSession();
      if (!next?.authenticated) {
        setLastError(
          "Your wallet was verified, but the session could not be saved. Please allow cookies and try again.",
        );
      }
    } catch (error) {
      setLastError(
        formatAuthConnectError({ message: (error as Error).message }),
      );
    } finally {
      changingSession.current = false;
      setLoading(false);
    }
  }, [enabled, lastSelectedAddress, refreshSession]);

  const disconnect = useCallback(async () => {
    if (!enabled || changingSession.current) return;
    changingSession.current = true;
    sessionRevision.current++;
    setLastError(null);
    setLoading(true);
    try {
      await apiLogout();
      setAuthenticated(false);
      setAddress(null);
      setEligible(false);
      setGateReason(undefined);
      await refreshSession();
    } catch (error) {
      setLastError(
        formatAuthConnectError({ message: (error as Error).message }),
      );
    } finally {
      changingSession.current = false;
      setLoading(false);
    }
  }, [enabled, refreshSession]);

  useEffect(() => {
    if (!enabled) return;
    const handle = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(handle);
  }, [enabled, refresh]);

  const value: AuthContextValue = {
    enabled,
    loading,
    authenticated,
    address,
    eligible,
    gateReason,
    lastError,
    connect,
    disconnect,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      enabled: false,
      loading: false,
      authenticated: false,
      address: null,
      eligible: false,
      gateReason: undefined,
      lastError: null,
      connect: async () => {},
      disconnect: async () => {},
      refresh: async () => null,
    };
  }
  return ctx;
}
