import type { FormEvent, RefObject } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  BarChart3,
  Bell,
  Boxes,
  CircleUserRound,
  History,
  LogIn,
  LogOut,
  Map,
  Moon,
  ShoppingCart,
  Sun,
  WalletCards
} from "lucide-react";
import type { ActiveTab, AuthMode } from "../types";

export function AppHeader({
  activeTab,
  recentBuysCount,
  remainingQuantity,
  portfolioCount,
  theme,
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
  onChangeTab,
  onToggleTheme,
  onToggleProfile,
  onAuthEmailChange,
  onAuthPasswordChange,
  onAuthSubmit,
  onSubmitAuth,
  onSignOut
}: {
  activeTab: ActiveTab;
  recentBuysCount: number;
  remainingQuantity: number;
  portfolioCount: number;
  theme: "light" | "dark";
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
  onChangeTab: (tab: ActiveTab) => void;
  onToggleTheme: () => void;
  onToggleProfile: () => void;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onAuthSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitAuth: (mode: AuthMode) => void;
  onSignOut: () => void;
}) {
  const tabs: { id: ActiveTab; label: string; icon: typeof ShoppingCart; count?: number }[] = [
    { id: "current", label: "Current Deal", icon: ShoppingCart },
    { id: "portfolio", label: "Portfolio", icon: WalletCards, count: portfolioCount },
    { id: "nearby", label: "Nearby", icon: Map },
    { id: "recent", label: "Recent Buys", icon: History, count: recentBuysCount },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "inventory", label: "Inventory", icon: Boxes, count: remainingQuantity }
  ];

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">o</div>
        <div>
          <strong>OfferTCG</strong>
          <span>Vendor Deal Desk</span>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Workspace views">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? " active" : ""}`}
            type="button"
            onClick={() => onChangeTab(tab.id)}
          >
            <tab.icon size={15} />
            {tab.label}
            {tab.count && tab.count > 0 ? (
              <span className="nav-count">{tab.count}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <nav className="tab-bar" aria-label="Workspace views">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            type="button"
            onClick={() => onChangeTab(tab.id)}
          >
            <tab.icon size={17} />
            {tab.label}
            {tab.count && tab.count > 0 ? (
              <span className="tab-count">{tab.count}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="topbar-controls">
        <button
          className="topbar-icon-btn"
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button className="topbar-icon-btn" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="profile-menu" ref={profilePopoverRef}>
          <button
            aria-expanded={isProfileOpen}
            aria-haspopup="dialog"
            aria-label="Open account menu"
            className="topbar-avatar"
            type="button"
            onClick={onToggleProfile}
          >
            <CircleUserRound size={20} />
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
                    className="btn btn-ghost btn-sm"
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
                    className="input"
                    type="email"
                    value={authEmail}
                    onChange={(event) => onAuthEmailChange(event.target.value)}
                    placeholder="Email"
                    autoComplete="email"
                  />
                  <input
                    className="input"
                    type="password"
                    value={authPassword}
                    onChange={(event) => onAuthPasswordChange(event.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                  <div className="auth-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      type="submit"
                      disabled={isAuthSubmitting}
                    >
                      <LogIn size={16} />
                      Log in
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
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
      </div>
    </header>
  );
}
