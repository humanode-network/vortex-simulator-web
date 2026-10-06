import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Link } from "react-router";
import { BadgeCheck, CircleCheck, Fingerprint, Wallet, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { shortAddress } from "@/lib/profileUi";
import { cn } from "@/lib/utils";
import { governanceIdentityStatuses } from "@/lib/humanNodesUi";
import { AddressInline } from "@/components/AddressInline";
import { Button } from "@/components/primitives/button";
import { useDismissOutside } from "@/hooks/useDismissOutside";
import { useAccountIdentity } from "./useAccountIdentity";
import { SidebarMedallion } from "../sidebar/SidebarMedallion";

const identityRows = [
  { key: "humanNode", Icon: Fingerprint },
  { key: "governor", Icon: BadgeCheck },
  { key: "activeGovernor", Icon: CircleCheck },
] as const;

export function SidebarAccount({
  onNavigate,
}: {
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const auth = useAuth();
  const address = auth.authenticated ? auth.address : null;
  const { result, retry } = useAccountIdentity(address);
  const [open, setOpen] = useState(false);
  const [showConnectError, setShowConnectError] = useState(false);
  const [action, setAction] = useState<"connect" | "disconnect" | null>(null);
  const [panelMaxHeight, setPanelMaxHeight] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTriggerFocus = useRef(false);
  const panelId = useId();
  const titleId = useId();
  const busy = action !== null || (!address && auth.loading);
  const panelVisible =
    (open && Boolean(address)) ||
    (showConnectError && Boolean(auth.lastError) && !address);

  useLayoutEffect(() => {
    if (!restoreTriggerFocus.current || busy) return;
    restoreTriggerFocus.current = false;
    if (document.activeElement === document.body) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [busy]);

  useEffect(() => {
    setOpen(false);
    setShowConnectError(false);
  }, [address]);

  useLayoutEffect(() => {
    if (!panelVisible) return;
    panelRef.current?.focus({ preventScroll: true });
    const updateHeight = () => {
      const top = panelRef.current?.getBoundingClientRect().top ?? 0;
      setPanelMaxHeight(Math.max(0, window.innerHeight - top - 16));
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.addEventListener("scroll", updateHeight, true);
    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("scroll", updateHeight, true);
    };
  }, [panelVisible]);

  const dismissOutside = useCallback(() => {
    setOpen(false);
    setShowConnectError(false);
  }, []);
  useDismissOutside(panelVisible, containerRef, dismissOutside);

  const close = () => {
    setOpen(false);
    setShowConnectError(false);
    triggerRef.current?.focus({ preventScroll: true });
  };
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    onNavigate(event);
  };
  const connect = async () => {
    if (busy) return;
    setOpen(false);
    setShowConnectError(false);
    setAction("connect");
    await auth.connect();
    setAction(null);
    setShowConnectError(true);
  };
  const disconnect = async () => {
    if (busy) return;
    restoreTriggerFocus.current = true;
    setAction("disconnect");
    await auth.disconnect();
    setAction(null);
  };

  if (!auth.enabled) return null;

  const label = address
    ? shortAddress(address, 6)
    : action === "connect"
      ? "Connecting..."
      : auth.loading
        ? "Checking wallet..."
        : "Connect wallet";
  const statusState = result?.state ?? "checking";
  const statuses = governanceIdentityStatuses(
    result?.state === "ready"
      ? result.data
      : { humanNode: false, governor: false, activeGovernor: false },
  );
  const verificationUnavailable =
    address &&
    ["rpc_not_configured", "rpc_error"].includes(auth.gateReason ?? "");

  return (
    <div
      className={cn(
        "sidebar__account",
        address && "sidebar__account--connected",
      )}
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key === "Escape" && panelVisible) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <Button
        ref={triggerRef}
        variant="bare"
        size="content"
        className="sidebar__accountTrigger"
        aria-label={
          address ? `Account details for ${shortAddress(address, 6)}` : label
        }
        aria-haspopup={address ? "dialog" : undefined}
        aria-expanded={address ? panelVisible : undefined}
        aria-controls={panelVisible ? panelId : undefined}
        aria-busy={busy}
        disabled={busy}
        onClick={() => (address ? setOpen((value) => !value) : void connect())}
      >
        <SidebarMedallion Icon={Wallet} className="sidebar__accountIcon">
          {address ? <span className="sidebar__connectionDot" /> : null}
        </SidebarMedallion>
        <span className="sidebar__accountLabel">
          <span>{label}</span>
          {address ? (
            <span className="sidebar__accountCaption">Connected</span>
          ) : null}
        </span>
      </Button>

      {address ? (
        <dl
          className="sidebar__identity"
          aria-label="Governance status"
          aria-live="polite"
          aria-busy={statusState === "checking"}
        >
          {identityRows.map(({ key, Icon }) => {
            const status = statuses[key];
            const state =
              key === "humanNode" && verificationUnavailable
                ? "unavailable"
                : statusState;
            const value =
              state === "ready"
                ? status.value
                : state === "checking"
                  ? "Checking"
                  : "Unavailable";
            return (
              <div
                className={cn(
                  "sidebar__identityRow",
                  state === "ready" &&
                    status.active &&
                    "sidebar__identityRow--active",
                )}
                key={key}
                title={`${status.label}: ${value}`}
              >
                <dt className="sidebar__identityLabel">
                  <span className="sidebar__identityIcon" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className="sidebar__identityText">{status.label}</span>
                </dt>
                <dd className="sidebar__authValue sidebar__identityText">
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}

      {panelVisible ? (
        <div
          ref={panelRef}
          id={panelId}
          className="sidebar__auth"
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          style={{ maxHeight: panelMaxHeight }}
        >
          <div className="sidebar__authHeader">
            <h2 id={titleId}>{address ? "Wallet" : "Connection problem"}</h2>
            <Button
              variant="bare"
              size="iconSm"
              aria-label="Close account details"
              onClick={close}
            >
              <X size={16} aria-hidden="true" />
            </Button>
          </div>
          {address ? (
            <>
              <AddressInline
                address={address}
                size={6}
                className="sidebar__authAddress"
                onNavigate={navigate}
              />
              {statusState === "unavailable" || verificationUnavailable ? (
                <div className="sidebar__authNotice" role="status">
                  {verificationUnavailable
                    ? "Human node verification is unavailable. Try again shortly."
                    : "Governance status could not be checked."}
                  <Button
                    variant="bare"
                    size="compact"
                    disabled={statusState === "checking" || auth.loading}
                    onClick={() => {
                      retry();
                      if (verificationUnavailable) void auth.refresh();
                    }}
                  >
                    Check again
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
          {auth.lastError ? (
            <p className="sidebar__authError" role="status">
              {auth.lastError}
            </p>
          ) : null}
          <div className="sidebar__authButtons">
            {address ? (
              <>
                <Button asChild variant="bare" size="compact">
                  <Link to="/app/profile" onClick={navigate}>
                    View profile
                  </Link>
                </Button>
                <Button
                  variant="bare"
                  size="compact"
                  disabled={busy}
                  onClick={() => void disconnect()}
                >
                  {action === "disconnect" ? "Disconnecting..." : "Disconnect"}
                </Button>
              </>
            ) : (
              <Button
                variant="bare"
                size="compact"
                disabled={busy}
                onClick={() => void connect()}
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
