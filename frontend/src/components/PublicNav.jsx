import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  Home as HomeIcon,
} from "lucide-react";

export function PublicNav() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/projects", label: "Projects" },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/about", label: "About" },
    { to: "/faq", label: "FAQ" },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    setOpen(false);
    nav(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* =====================================================
            LOGO
        ===================================================== */}
        <Link
          to="/"
          className="group flex items-center gap-2.5"
          data-testid="logo-link"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-[11px] font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            E
          </div>

          <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-slate-950">
            EVIDENT
          </span>
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ===================================================== */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = isActive(link.to);

            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                ].join(" ")}
                data-testid={`nav-${link.label
                  .toLowerCase()
                  .replace(/\s/g, "-")}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* =====================================================
            DESKTOP AUTH ACTIONS
        ===================================================== */}
        <div className="hidden items-center gap-2.5 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-slate-200 bg-white px-3.5 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => nav("/admin")}
                  data-testid="nav-admin-btn"
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Admin
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-slate-200 bg-white px-3.5 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => nav("/dashboard")}
                data-testid="nav-dashboard-btn"
              >
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg px-3.5 text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                onClick={() => {
                  logout();
                  nav("/");
                }}
                data-testid="nav-logout-btn"
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg px-3.5 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                onClick={() => nav("/login")}
                data-testid="nav-login-btn"
              >
                Log in
              </Button>

              <Button
                size="sm"
                className="h-9 rounded-lg bg-slate-950 px-4 font-semibold text-white shadow-sm hover:bg-blue-700"
                onClick={() => nav("/register")}
                data-testid="nav-register-btn"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* =====================================================
            MOBILE MENU BUTTON
        ===================================================== */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          data-testid="mobile-menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* =======================================================
          MOBILE NAVIGATION
      ======================================================= */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-6 py-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">

            {links.map((link) => {
              const active = isActive(link.to);

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={[
                    "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ")}
                  data-testid={`mnav-${link.label
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                >
                  {link.to === "/" && (
                    <HomeIcon className="mr-2.5 h-4 w-4" />
                  )}

                  {link.label}
                </Link>
              );
            })}

            <div className="my-3 border-t border-slate-100" />

            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-full rounded-xl"
                    onClick={() => handleNavigation("/dashboard")}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full rounded-xl"
                      onClick={() => handleNavigation("/admin")}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-full rounded-xl"
                    onClick={() => {
                      logout();
                      setOpen(false);
                      nav("/");
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-full rounded-xl"
                    onClick={() => handleNavigation("/login")}
                  >
                    Log in
                  </Button>

                  <Button
                    size="sm"
                    className="h-10 w-full rounded-xl bg-slate-950 font-semibold hover:bg-blue-700"
                    onClick={() => handleNavigation("/register")}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">

        <div className="grid gap-10 md:grid-cols-4">

          {/* BRAND */}
          <div>
            <Link
              to="/"
              className="group inline-flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-[11px] font-bold text-white">
                E
              </div>

              <span className="font-display text-lg font-bold tracking-tight text-slate-950">
                EVIDENT
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
              Build real projects. Generate verifiable proof of your
              practical skills.
            </p>

            <Link
              to="/"
              className="mt-5 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Back to Home
              <span className="ml-1">→</span>
            </Link>
          </div>

          {/* PLATFORM */}
          <FooterCol
            title="Platform"
            links={[
              ["Home", "/"],
              ["Projects", "/projects"],
              ["How It Works", "/how-it-works"],
              ["FAQ", "/faq"],
            ]}
          />

          {/* COMPANY */}
          <FooterCol
            title="Company"
            links={[
              ["About", "/about"],
              ["Contact", "/contact"],
            ]}
          />

          {/* LEGAL */}
          <FooterCol
            title="Legal"
            links={[
              ["Privacy", "/privacy"],
              ["Terms", "/terms"],
              ["Refund Policy", "/refund-policy"],
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} EVIDENT. A project experience
            platform.
          </span>

          <Link
            to="/"
            className="transition-colors hover:text-slate-600"
          >
            Build. Prove. Grow.
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <ul className="mt-5 space-y-3">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link
              to={to}
              className="text-sm text-slate-600 transition-colors hover:text-blue-600"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicNav />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}