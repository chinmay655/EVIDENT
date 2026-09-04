import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FolderKanban, Users, GraduationCap, FileCheck2, Award,
  MessageSquare, ScrollText, LogOut, Menu, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/enrollments", label: "Enrollments", icon: GraduationCap },
  { to: "/admin/submissions", label: "Submissions", icon: FileCheck2 },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/certificates", label: "Certificates", icon: Award },
  { to: "/admin/questions", label: "Questions", icon: MessageSquare },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (n) => (n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to));

  const Inner = () => (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-900 text-[11px] font-bold">E</div>
        <span className="font-display text-lg font-bold text-white">EVIDENT</span>
        <span className="ml-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">ADMIN</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)} data-testid={`admin-nav-${n.label.toLowerCase()}`}
            className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(n) ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800")}>
            <n.icon className="h-4 w-4" strokeWidth={1.75} /> {n.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <Link to="/" className="mb-2 flex items-center gap-2 px-3 text-xs text-slate-400 hover:text-white"><ExternalLink className="h-3.5 w-3.5" /> View public site</Link>
        <div className="mb-3 px-3">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.role}</p>
        </div>
        <Button variant="outline" size="sm" className="w-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white" onClick={() => { logout(); nav("/"); }} data-testid="admin-logout">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block"><Inner /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64"><Inner /></aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} data-testid="admin-menu-toggle" aria-label="Open menu"><Menu className="h-6 w-6" /></button>
          <h1 className="font-display text-lg font-bold text-slate-900">{title}</h1>
        </header>
        <div className="animate-fade-in p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
