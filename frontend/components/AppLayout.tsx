"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers,
  Menu,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/",         label: "Dashboard", icon: LayoutDashboard },
  { href: "/papers",   label: "Papers",    icon: FileText        },
  { href: "/analysis", label: "Analysis",  icon: BarChart3       },
  { href: "/settings", label: "Settings",  icon: Settings        },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(localStorage.getItem("krr_email") || "");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("krr_token");
    localStorage.removeItem("krr_email");
    router.push("/login");
  };

  const activeLabel =
    NAV_ITEMS.find((n) =>
      n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)
    )?.label ?? "Overview";

  const sidebarCls = `krr-sidebar ${collapsed ? "krr-sidebar--narrow" : "krr-sidebar--wide"}`;
  const mainCls    = `krr-main ${collapsed ? "krr-main--narrow" : "krr-main--wide"}`;
  const wide       = !collapsed;

  const SidebarContent = (
    <>
      {/* Brand */}
      <div className={`krr-brand ${wide ? "krr-brand--wide" : "krr-brand--narrow"}`}>
        <div className="krr-brand__logo">
          <Layers size={16} strokeWidth={2} />
        </div>
        {wide && (
          <div>
            <div className="krr-brand__name">KRR</div>
            <div className="krr-brand__sub">Knowledge Repository</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`krr-nav ${wide ? "krr-nav--wide" : "krr-nav--narrow"}`}>
        {wide && <div className="eyebrow krr-nav__eyebrow">Menu</div>}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={[
                "krr-nav__item",
                wide ? "krr-nav__item--wide" : "krr-nav__item--narrow",
                active ? "krr-nav__item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={!wide ? label : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.75} />
              {wide && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="krr-collapse">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="krr-collapse__btn"
        >
          {collapsed ? (
            <ChevronRight size={15} />
          ) : (
            <>
              <ChevronLeft size={15} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User / Logout */}
      <div className={`krr-user ${wide ? "krr-user--wide" : "krr-user--narrow"}`}>
        {wide && email && (
          <div className="krr-user__info">
            <div className="krr-user__avatar">{email[0].toUpperCase()}</div>
            <div className="krr-user__text">
              <div className="krr-user__email">{email}</div>
              <div className="krr-user__plan">Free Plan</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={[
            "krr-user__logout",
            wide ? "krr-user__logout--wide" : "krr-user__logout--narrow",
          ].join(" ")}
          title={!wide ? "Sign out" : undefined}
        >
          <LogOut size={17} />
          {wide && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="krr-shell">
      {/* Grid texture */}
      <div className="krr-grid-bg" />

      {/* Desktop sidebar */}
      <aside className={sidebarCls}>{SidebarContent}</aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="krr-overlay"
          onClick={() => setMobileOpen(false)}
          role="presentation"
        />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <aside className="krr-drawer">{SidebarContent}</aside>
      )}

      {/* Main content */}
      <div className={mainCls}>
        {/* Top bar */}
        <header className="krr-topbar">
          <div className="krr-topbar__crumb">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="krr-burger"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="krr-topbar__crumb-text">
              KRR /{" "}
              <span className="krr-topbar__crumb-page">{activeLabel}</span>
            </div>
          </div>
          <div className="krr-topbar__right">
            <ThemeToggle />
          </div>
        </header>

        <main className="krr-main-content">{children}</main>
      </div>
    </div>
  );
}
