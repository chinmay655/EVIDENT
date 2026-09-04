import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/apiClient";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/dashboard";
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success("Welcome back!");
      const dest = (u.role === "admin" || u.role === "super_admin") && from === "/dashboard" ? "/admin" : from;
      nav(dest, { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Log in" subtitle="Access your projects and workspace."
      footer={<>Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:underline" data-testid="to-register">Create one</Link></>}>
      <form onSubmit={submit} className="space-y-5">
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1.5" data-testid="login-email" /></div>
        <div>
          <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-blue-600 hover:underline" data-testid="to-forgot">Forgot?</Link></div>
          <Input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="mt-1.5" data-testid="login-password" />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800" data-testid="login-submit">{loading ? "Logging in…" : "Log in"}</Button>
      </form>
    </AuthShell>
  );
}
