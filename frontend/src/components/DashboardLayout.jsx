import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Award,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  FileCheck2,
  FolderKanban,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Send,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

/* ============================================================
   STUDENT NAVIGATION
============================================================ */

const NAV = [
  {
    to: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    to: "/projects",
    label: "Explore Projects",
    icon: FolderKanban,
  },
  {
    to: "/enrollments",
    label: "My Enrollments",
    icon: BriefcaseBusiness,
  },
  {
    to: "/workspace",
    label: "My Workspace",
    icon: FolderOpen,
  },
  {
    to: "/submissions",
    label: "Submissions",
    icon: FileCheck2,
  },
  {
    to: "/certificates",
    label: "Certificates",
    icon: Award,
  },
  {
    to: "/profile",
    label: "Settings",
    icon: Settings,
  },
];

/* ============================================================
   DASHBOARD LAYOUT
============================================================ */

export function DashboardLayout({ children, title }) {
  const { user, isAdmin, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [notifications, setNotifications] = useState({
    items: [],
    unread: 0,
  });

  /* ==========================================================
     USER HELPERS
  ========================================================== */

  const firstName =
    user?.name?.trim()?.split(/\s+/)[0] || "Student";

  const initials =
    user?.name
      ?.trim()
      ?.split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  /* ==========================================================
     NOTIFICATIONS
  ========================================================== */

  const loadNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");

      setNotifications({
        items: data?.items || [],
        unread: data?.unread || 0,
      });
    } catch {
      /*
       * Notification failure should never make
       * the entire dashboard unusable.
       */
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [location.pathname]);

  const markAllNotificationsRead = async () => {
    try {
      await api.post("/notifications/read-all");
      await loadNotifications();
    } catch {
      // Ignore notification errors.
    }
  };

  const openNotification = async (notification) => {
    try {
      await api.patch(
        `/notifications/${notification.id}/read`
      );

      await loadNotifications();
    } catch {
      // Navigation should still work.
    }

    if (notification?.link) {
      navigate(notification.link);
    }
  };

  /* ==========================================================
     SEARCH
  ========================================================== */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      navigate("/projects");
      return;
    }

    navigate(
      `/projects?search=${encodeURIComponent(value)}`
    );
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setMobileOpen(false);
      navigate("/");
    }
  };

  /* ==========================================================
     ACTIVE NAVIGATION
  ========================================================== */

  const isNavActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  /* ==========================================================
     SIDEBAR
  ========================================================== */

  const Sidebar = () => {
    return (
      <div className="flex h-full flex-col bg-white">

        {/* ======================================================
            BRAND
        ====================================================== */}

        <div className="flex h-[72px] shrink-0 items-center border-b border-slate-200 px-5">

          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="group flex items-center gap-2.5"
            data-testid="dashboard-logo-link"
          >

            <div
              className="
                flex h-9 w-9 items-center justify-center
                rounded-xl bg-slate-950
                text-xs font-bold text-white
                shadow-sm
                transition-transform duration-200
                group-hover:scale-105
              "
            >
              E
            </div>

            <div className="min-w-0">

              <span
                className="
                  block font-display
                  text-[19px] font-bold
                  tracking-tight text-slate-950
                "
              >
                EVIDENT
              </span>

              <p
                className="
                  text-[9px] font-semibold
                  uppercase tracking-[0.18em]
                  text-slate-400
                "
              >
                Project Experience
              </p>

            </div>

          </Link>

        </div>

        {/* ======================================================
            NAVIGATION
        ====================================================== */}

        <div className="flex-1 overflow-y-auto px-4 py-6">

          <p
            className="
              mb-3 px-3
              text-[10px] font-bold
              uppercase tracking-[0.16em]
              text-slate-400
            "
          >
            Workspace
          </p>

          <nav className="space-y-1">

            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`sidebar-${item.label
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                  className={cn(
                    `
                      group flex items-center gap-3
                      rounded-xl px-3.5 py-3
                      text-sm font-medium
                      transition-all duration-200
                    `,
                    active
                      ? `
                        bg-blue-50
                        text-blue-700
                        shadow-sm
                      `
                      : `
                        text-slate-600
                        hover:bg-slate-50
                        hover:text-slate-950
                      `
                  )}
                >

                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                    strokeWidth={1.8}
                  />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {/* Notification count */}
                  {item.to === "/notifications" &&
                    notifications.unread > 0 && (
                      <span
                        className="
                          min-w-[20px]
                          rounded-full
                          bg-blue-600
                          px-1.5 py-0.5
                          text-center
                          text-[10px]
                          font-bold
                          text-white
                        "
                      >
                        {notifications.unread > 99
                          ? "99+"
                          : notifications.unread}
                      </span>
                    )}

                </Link>
              );
            })}

          </nav>

          {/* ====================================================
              ADMIN AREA
          ==================================================== */}

          {isAdmin && (
            <div className="mt-8">

              <p
                className="
                  mb-3 px-3
                  text-[10px] font-bold
                  uppercase tracking-[0.16em]
                  text-slate-400
                "
              >
                Administration
              </p>

              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                data-testid="sidebar-admin"
                className={cn(
                  `
                    group flex items-center gap-3
                    rounded-xl px-3.5 py-3
                    text-sm font-medium
                    transition-all duration-200
                  `,
                  location.pathname.startsWith("/admin")
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-blue-700 hover:bg-blue-50"
                )}
              >

                <ShieldCheck
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.8}
                />

                <span className="flex-1">
                  Admin Panel
                </span>

              </Link>

            </div>
          )}

          {/* ====================================================
              DISCOVER PROJECTS CTA
          ==================================================== */}

          <div
            className="
              mt-8 overflow-hidden
              rounded-2xl
              border border-blue-100
              bg-gradient-to-br
              from-blue-50 via-indigo-50
              to-white
              p-4
            "
          >

            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl bg-white
                shadow-sm
              "
            >
              <Award className="h-5 w-5 text-blue-600" />
            </div>

            <h3
              className="
                mt-4
                text-sm font-bold
                leading-5 text-slate-950
              "
            >
              Turn your skills into real experience
            </h3>

            <p
              className="
                mt-2
                text-xs leading-5
                text-slate-500
              "
            >
              Work on industry-style projects,
              build practical evidence, and
              strengthen your resume.
            </p>

            <Link
              to="/projects"
              onClick={() => setMobileOpen(false)}
              className="
                mt-4 flex
                items-center justify-center
                rounded-xl bg-white
                px-3 py-2.5
                text-xs font-semibold
                text-blue-700
                shadow-sm
                transition-all
                hover:bg-blue-600
                hover:text-white
              "
            >
              Explore Projects
            </Link>

          </div>

        </div>

        {/* ======================================================
            USER AREA
        ====================================================== */}

        <div
          className="
            shrink-0
            border-t border-slate-200
            p-4
          "
        >

          <div
            className="
              flex items-center gap-3
              rounded-xl
              bg-slate-50
              p-3
            "
          >

            <div
              className="
                flex h-9 w-9
                shrink-0 items-center justify-center
                rounded-full
                bg-gradient-to-br
                from-blue-100 to-indigo-100
                text-xs font-bold
                text-blue-700
              "
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">

              <p
                className="
                  truncate
                  text-sm font-semibold
                  text-slate-800
                "
              >
                {user?.name || "Student"}
              </p>

              <p
                className="
                  truncate
                  text-[11px]
                  text-slate-500
                "
              >
                {user?.email || ""}
              </p>

            </div>

          </div>

          <Button
            variant="ghost"
            size="sm"
            className="
              mt-2 h-9 w-full
              justify-start rounded-xl
              px-3
              text-slate-500
              hover:bg-red-50
              hover:text-red-600
            "
            onClick={handleLogout}
            data-testid="dashboard-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>

        </div>

      </div>
    );
  };

  /* ============================================================
     TOP NAV LINK
  ============================================================ */

  const TopNavLink = ({ to, children }) => {
    const active =
      location.pathname === to ||
      location.pathname.startsWith(`${to}/`);

    return (
      <Link
        to={to}
        className={cn(
          `
            rounded-lg px-3 py-2
            text-sm font-medium
            transition
          `,
          active
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
        )}
      >
        {children}
      </Link>
    );
  };

  /* ============================================================
     NOTIFICATIONS
  ============================================================ */

  const NotificationPopover = () => {
    return (
      <Popover>

        <PopoverTrigger asChild>

          <button
            className="
              relative flex h-10 w-10
              items-center justify-center
              rounded-xl
              text-slate-600
              transition
              hover:bg-slate-100
            "
            data-testid="notification-bell"
            aria-label="Notifications"
          >

            <Bell className="h-[18px] w-[18px]" />

            {notifications.unread > 0 && (
              <span
                className="
                  absolute right-2 top-1.5
                  flex h-2.5 w-2.5
                  items-center justify-center
                  rounded-full
                  bg-red-500
                  ring-2 ring-white
                "
              />
            )}

          </button>

        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={10}
          className="
            w-[350px]
            overflow-hidden
            rounded-2xl
            border-slate-200
            p-0
            shadow-xl
          "
        >

          {/* HEADER */}

          <div
            className="
              flex items-center
              justify-between
              border-b border-slate-100
              px-4 py-3.5
            "
          >

            <div>

              <p
                className="
                  text-sm font-bold
                  text-slate-900
                "
              >
                Notifications
              </p>

              <p
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
              >
                {notifications.unread > 0
                  ? `${notifications.unread} unread`
                  : "You're all caught up"}
              </p>

            </div>

            {notifications.unread > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="
                  text-xs font-semibold
                  text-blue-600
                  hover:text-blue-700
                  hover:underline
                "
                data-testid="mark-all-read"
              >
                Mark all read
              </button>
            )}

          </div>

          {/* LIST */}

          <div className="max-h-[360px] overflow-y-auto">

            {notifications.items.length === 0 ? (

              <div
                className="
                  px-6 py-12
                  text-center
                "
              >

                <div
                  className="
                    mx-auto
                    flex h-12 w-12
                    items-center justify-center
                    rounded-full
                    bg-slate-50
                  "
                >
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>

                <p
                  className="
                    mt-3
                    text-sm font-medium
                    text-slate-700
                  "
                >
                  No notifications
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  We'll let you know when
                  something needs your attention.
                </p>

              </div>

            ) : (

              notifications.items
                .slice(0, 12)
                .map((notification) => (

                  <button
                    key={notification.id}
                    onClick={() =>
                      openNotification(notification)
                    }
                    className={cn(
                      `
                        block w-full
                        border-b border-slate-100
                        px-4 py-3.5
                        text-left
                        transition
                        last:border-b-0
                        hover:bg-slate-50
                      `,
                      !notification.read &&
                        "bg-blue-50/50"
                    )}
                  >

                    <div className="flex gap-3">

                      <div
                        className={cn(
                          `
                            mt-0.5
                            flex h-8 w-8
                            shrink-0
                            items-center justify-center
                            rounded-lg
                          `,
                          notification.read
                            ? "bg-slate-100"
                            : "bg-blue-100"
                        )}
                      >

                        <Bell
                          className={cn(
                            "h-4 w-4",
                            notification.read
                              ? "text-slate-400"
                              : "text-blue-600"
                          )}
                        />

                      </div>

                      <div className="min-w-0 flex-1">

                        <div
                          className="
                            flex items-start
                            justify-between gap-2
                          "
                        >

                          <p
                            className="
                              text-sm font-semibold
                              text-slate-800
                            "
                          >
                            {notification.title}
                          </p>

                          {!notification.read && (
                            <span
                              className="
                                mt-1.5
                                h-1.5 w-1.5
                                shrink-0
                                rounded-full
                                bg-blue-600
                              "
                            />
                          )}

                        </div>

                        <p
                          className="
                            mt-1
                            line-clamp-2
                            text-xs leading-5
                            text-slate-500
                          "
                        >
                          {notification.message}
                        </p>

                      </div>

                    </div>

                  </button>

                ))

            )}

          </div>

          {/* VIEW ALL */}

          {notifications.items.length > 0 && (
            <div
              className="
                border-t border-slate-100
                p-3
              "
            >

              <Link
                to="/notifications"
                className="
                  flex items-center
                  justify-center
                  rounded-xl
                  bg-slate-50
                  py-2.5
                  text-xs font-semibold
                  text-slate-700
                  transition
                  hover:bg-blue-50
                  hover:text-blue-700
                "
              >
                View all notifications
              </Link>

            </div>
          )}

        </PopoverContent>

      </Popover>
    );
  };

  /* ============================================================
     PROFILE MENU
  ============================================================ */

  const ProfileMenu = () => {
    return (
      <Popover>

        <PopoverTrigger asChild>

          <button
            className="
              group flex items-center
              gap-2
              rounded-xl
              px-2 py-1.5
              transition
              hover:bg-slate-50
            "
            data-testid="dashboard-profile-menu"
          >

            <div
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-full
                bg-gradient-to-br
                from-blue-100 to-indigo-100
                text-xs font-bold
                text-blue-700
              "
            >
              {initials}
            </div>

            <div className="hidden text-left sm:block">

              <p
                className="
                  max-w-[130px]
                  truncate
                  text-xs font-semibold
                  text-slate-900
                "
              >
                Hi, {firstName}
              </p>

              <p
                className="
                  text-[10px]
                  text-slate-400
                "
              >
                {isAdmin ? "Administrator" : "Student"}
              </p>

            </div>

            <ChevronDown
              className="
                hidden h-4 w-4
                text-slate-400
                transition
                group-hover:text-slate-600
                sm:block
              "
            />

          </button>

        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={10}
          className="
            w-64
            rounded-2xl
            border-slate-200
            p-2
            shadow-xl
          "
        >

          {/* USER INFO */}

          <div
            className="
              mb-2
              rounded-xl
              bg-slate-50
              p-3
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-blue-100 to-indigo-100
                  text-xs font-bold
                  text-blue-700
                "
              >
                {initials}
              </div>

              <div className="min-w-0">

                <p
                  className="
                    truncate
                    text-sm font-semibold
                    text-slate-900
                  "
                >
                  {user?.name || "Student"}
                </p>

                <p
                  className="
                    truncate
                    text-xs
                    text-slate-500
                  "
                >
                  {user?.email || ""}
                </p>

              </div>

            </div>

          </div>

          {/* PROFILE */}

          <Link
            to="/profile"
            className="
              flex items-center gap-3
              rounded-xl
              px-3 py-2.5
              text-sm
              text-slate-600
              transition
              hover:bg-slate-50
              hover:text-slate-950
            "
          >
            <User className="h-4 w-4" />
            Profile & Settings
          </Link>

          {/* CERTIFICATES */}

          <Link
            to="/certificates"
            className="
              flex items-center gap-3
              rounded-xl
              px-3 py-2.5
              text-sm
              text-slate-600
              transition
              hover:bg-slate-50
              hover:text-slate-950
            "
          >
            <Award className="h-4 w-4" />
            My Certificates
          </Link>

          {/* ADMIN */}

          {isAdmin && (
            <Link
              to="/admin"
              className="
                flex items-center gap-3
                rounded-xl
                px-3 py-2.5
                text-sm
                text-blue-700
                transition
                hover:bg-blue-50
              "
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          <div
            className="
              my-1
              border-t border-slate-100
            "
          />

          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            className="
              flex w-full
              items-center gap-3
              rounded-xl
              px-3 py-2.5
              text-left
              text-sm
              text-slate-600
              transition
              hover:bg-red-50
              hover:text-red-600
            "
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>

        </PopoverContent>

      </Popover>
    );
  };

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f7faff]">

      {/* ========================================================
          DESKTOP SIDEBAR
      ======================================================== */}

      <aside
        className="
          fixed inset-y-0 left-0
          z-40 hidden
          w-[250px]
          border-r border-slate-200
          bg-white
          lg:block
        "
      >
        <Sidebar />
      </aside>

      {/* ========================================================
          MOBILE SIDEBAR
      ======================================================== */}

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">

          {/* BACKDROP */}

          <div
            className="
              absolute inset-0
              bg-slate-950/30
              backdrop-blur-sm
            "
            onClick={() => setMobileOpen(false)}
          />

          {/* SIDEBAR */}

          <aside
            className="
              absolute inset-y-0 left-0
              w-[285px]
              bg-white
              shadow-2xl
            "
          >

            {/* MOBILE CLOSE */}

            <button
              onClick={() => setMobileOpen(false)}
              className="
                absolute right-3 top-4
                z-10
                flex h-9 w-9
                items-center justify-center
                rounded-lg
                text-slate-500
                hover:bg-slate-100
              "
              aria-label="Close dashboard menu"
            >
              <X className="h-5 w-5" />
            </button>

            <Sidebar />

          </aside>

        </div>
      )}

      {/* ========================================================
          MAIN
      ======================================================== */}

      <div className="lg:pl-[250px]">

        {/* ======================================================
            TOP BAR
        ====================================================== */}

        <header
          className="
            sticky top-0 z-30
            border-b
            border-slate-200/80
            bg-white/95
            backdrop-blur-xl
          "
        >

          <div
            className="
              flex h-[72px]
              items-center
              gap-3
              px-4
              sm:px-6
              lg:px-8
            "
          >

            {/* MOBILE MENU */}

            <button
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                text-slate-600
                transition
                hover:bg-slate-100
                lg:hidden
              "
              onClick={() => setMobileOpen(true)}
              data-testid="dashboard-menu-toggle"
              aria-label="Open dashboard menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* ==================================================
                TOP NAVIGATION
            ================================================== */}

            <nav
              className="
                hidden
                items-center
                gap-1
                xl:flex
              "
            >

              <TopNavLink to="/projects">
                Projects
              </TopNavLink>

              <TopNavLink to="/how-it-works">
                How It Works
              </TopNavLink>

              <TopNavLink to="/about">
                About
              </TopNavLink>

              <TopNavLink to="/faq">
                FAQ
              </TopNavLink>

            </nav>

            {/* ==================================================
                SEARCH
            ================================================== */}

            <form
              onSubmit={handleSearchSubmit}
              className="
                ml-auto
                hidden
                max-w-[390px]
                flex-1
                lg:flex
              "
            >

              <div className="relative w-full">

                <Search
                  className="
                    pointer-events-none
                    absolute left-3.5 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(event.target.value)
                  }
                  placeholder="
                    Search projects, skills or technologies...
                  "
                  className="
                    h-10 w-full
                    rounded-xl
                    border border-transparent
                    bg-slate-100/80
                    pl-10 pr-4
                    text-xs
                    text-slate-800
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-blue-200
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-50
                  "
                  aria-label="Search projects"
                />

              </div>

            </form>

            {/* ==================================================
                RIGHT SIDE
            ================================================== */}

            <div
              className="
                ml-auto
                flex items-center gap-1
                lg:ml-3
                sm:gap-2
              "
            >

              {/* HOME */}

              <Link
                to="/"
                className="
                  hidden h-9
                  items-center gap-2
                  rounded-lg
                  px-3
                  text-xs font-medium
                  text-slate-500
                  transition
                  hover:bg-slate-50
                  hover:text-slate-900
                  sm:flex
                "
                title="Go to public home"
              >

                <Home className="h-4 w-4" />

                <span className="hidden xl:inline">
                  Home
                </span>

              </Link>

              {/* NOTIFICATIONS */}

              <NotificationPopover />

              {/* DIVIDER */}

              <div
                className="
                  hidden h-8 w-px
                  bg-slate-200
                  sm:block
                "
              />

              {/* PROFILE */}

              <ProfileMenu />

            </div>

          </div>

          {/* ====================================================
              MOBILE SEARCH
          ==================================================== */}

          <div
            className="
              border-t
              border-slate-100
              px-4 py-3
              lg:hidden
            "
          >

            <form onSubmit={handleSearchSubmit}>

              <div className="relative">

                <Search
                  className="
                    pointer-events-none
                    absolute left-3.5 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(event.target.value)
                  }
                  placeholder="
                    Search projects, skills or technologies...
                  "
                  className="
                    h-10 w-full
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    pl-10 pr-4
                    text-xs
                    text-slate-800
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-blue-200
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-50
                  "
                  aria-label="Search projects"
                />

              </div>

            </form>

          </div>

        </header>

        {/* ======================================================
            PAGE CONTENT
        ====================================================== */}

        <main
          className="
            animate-fade-in
            p-4
            sm:p-5
            lg:p-7
            xl:p-8
          "
        >
          {children}
        </main>

      </div>

    </div>
  );
}