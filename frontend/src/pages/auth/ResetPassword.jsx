import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password: form.password });
      toast.success("Password reset. Please log in.");
      nav("/login");
    } catch (err) { toast.error(apiError(err)); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password."
      footer={<Link to="/login" className="font-medium text-blue-600 hover:underline">Back to login</Link>}>
      {!token ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Invalid or missing reset token.</div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div><Label htmlFor="pw">New password</Label><Input id="pw" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="mt-1.5" data-testid="reset-password" /></div>
          <div><Label htmlFor="cpw">Confirm password</Label><Input id="cpw" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required className="mt-1.5" data-testid="reset-confirm" /></div>
          <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800" data-testid="reset-submit">{loading ? "Resetting…" : "Reset password"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
