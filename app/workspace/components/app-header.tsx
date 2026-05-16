import type { FormEvent, RefObject } from "react";
import type { Session } from "@supabase/supabase-js";
import { CircleUserRound, LogIn, LogOut } from "lucide-react";
import type { AuthMode, DealCartTotals } from "../types";
import { formatCurrency } from "../formatters";
import { SummaryMetric } from "./primitives";

export function AppHeader({
  totals,
  session,
  supabaseEnabled,
  isProfileOpen,
  profilePopoverRef,
  isAuthReady,
  isAuthSubmitting,
  isCloudLoading,
  cloudMessage,
  authEmail,
  authPassword,
  authMessage,
  onToggleProfile,
  onAuthEmailChange,
  onAuthPasswordChange,
  onAuthSubmit,
  onSubmitAuth,
  onSignOut
}: {
  totals: DealCartTotals;
  session: Session | null;
  supabaseEnabled: boolean;
  isProfileOpen: boolean;
  profilePopoverRef: RefObject<HTMLDivElement | null>;
  isAuthReady: boolean;
  isAuthSubmitting: boolean;
  isCloudLoading: boolean;
  cloudMessage: string;
  authEmail: string;
  authPassword: string;
  authMessage: string;
  onToggleProfile: () => void;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onAuthSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitAuth: (mode: AuthMode) => void;
  onSignOut: () => void;
}) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Vendor buy tool</p>
        <h1>OfferTCG</h1>
        <p className="header-copy">
          Search Pokemon cards, add the right version, and price a buy offer
          at your target percentage.
        </p>
      </div>
      <div className="header-side">
        <div className="profile-menu" ref={profilePopoverRef}>
          <button
            aria-expanded={isProfileOpen}
            aria-haspopup="dialog"
            aria-label="Open account menu"
            className="profile-button"
            type="button"
            onClick={onToggleProfile}
          >
            <CircleUserRound size={23} />
            {session ? <span className="profile-status" /> : null}
          </button>

          {isProfileOpen ? (
            <section
              className="profile-popover"
              role="dialog"
              aria-label="Account sync"
            >
              <div>
                <p className="eyebrow">Account</p>
                {session ? (
                  <strong>{session.user.email}</strong>
                ) : (
                  <strong>{supabaseEnabled ? "Cloud sync" : "Local mode"}</strong>
                )}
              </div>

              {!isAuthReady ? (
                <p className="auth-message">Checking account...</p>
              ) : session ? (
                <div className="auth-row">
                  <span>{isCloudLoading ? "Syncing..." : cloudMessage}</span>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={onSignOut}
                    disabled={isAuthSubmitting}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              ) : supabaseEnabled ? (
                <form className="auth-form" onSubmit={onAuthSubmit}>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => onAuthEmailChange(event.target.value)}
                    placeholder="Email"
                    autoComplete="email"
                  />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(event) => onAuthPasswordChange(event.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                  <div className="auth-actions">
                    <button
                      className="secondary-button"
                      type="submit"
                      disabled={isAuthSubmitting}
                    >
                      <LogIn size={16} />
                      Log in
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => onSubmitAuth("signup")}
                      disabled={isAuthSubmitting}
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              ) : (
                <p className="auth-message">
                  Add Supabase env vars to enable account sync.
                </p>
              )}

              {authMessage ? (
                <p className="auth-message">{authMessage}</p>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="summary-grid" aria-label="Current deal totals">
          <SummaryMetric
            label="Market value"
            value={formatCurrency(totals.marketValue)}
          />
          <SummaryMetric
            label="Suggested payout"
            value={formatCurrency(totals.payout)}
            strong
          />
          <SummaryMetric label="Cards" value={totals.quantity.toString()} />
        </div>
      </div>
    </header>
  );
}
