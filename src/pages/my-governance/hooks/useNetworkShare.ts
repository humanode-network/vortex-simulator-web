import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/app/auth/AuthContext";
import { apiNetworkShare } from "@/lib/apiClient";
import type { NetworkShareDto } from "@/types/api";

const REFRESH_INTERVAL_MS = 60_000;
type NetworkShareState = {
  address: string;
  share: NetworkShareDto | null;
  status: "ready" | "unavailable";
};

export function useNetworkShare() {
  const { address } = useAuth();
  const [state, setState] = useState<NetworkShareState | null>(null);
  const requestRef = useRef<{
    address: string;
    promise: Promise<NetworkShareDto>;
  } | null>(null);

  useEffect(() => {
    setState(null);
    if (!address) {
      requestRef.current = null;
      return;
    }
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return;
      const request =
        requestRef.current?.address === address
          ? requestRef.current
          : { address, promise: apiNetworkShare() };
      requestRef.current = request;
      pending = true;
      try {
        const share = await request.promise;
        if (active) setState({ address, share, status: "ready" });
      } catch {
        if (active) setState({ address, share: null, status: "unavailable" });
      } finally {
        if (requestRef.current === request) requestRef.current = null;
        pending = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [address]);

  if (!address) return { share: null, status: "disconnected" as const };
  if (state?.address !== address)
    return { share: null, status: "loading" as const };
  return state;
}
