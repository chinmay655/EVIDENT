import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/apiClient";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/dashboard";
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm_password: "",
    phone: "", college: "", degree: "", graduation_year: "", skills: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await register({
        full_name: form.full_name, email: form.email, password: form.password,
        confirm_password: form.confirm_password, phone: form.phone || null,
        college: form.college || null, degree: form.degree || null,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      toast.success("Account created!");
      nav(from, { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start building verifiable project experience."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:underline" data-testid="to-login">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="name">Full name *</Label><Input id="name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required className="mt-1.5" data-testid="reg-name" /></div>
        <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className="mt-1.5" data-testid="reg-email" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="pw">Password *</Label><Input id="pw" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required className="mt-1.5" data-testid="reg-password" /></div>
          <div><Label htmlFor="cpw">Confirm *</Label><Input id="cpw" type="password" value={form.confirm_password} onChange={(e) => set("confirm_password", e.target.value)} required className="mt-1.5" data-testid="reg-confirm" /></div>
        </div>
        <p className="text-xs text-slate-400">Min 8 characters, with letters and numbers.</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="college">College</Label><Input id="college" value={form.college} onChange={(e) => set("college", e.target.value)} className="mt-1.5" data-testid="reg-college" /></div>
          <div><Label htmlFor="degree">Degree</Label><Input id="degree" value={form.degree} onChange={(e) => set("degree", e.target.value)} className="mt-1.5" data-testid="reg-degree" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="grad">Graduation year</Label><Input id="grad" type="number" value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} className="mt-1.5" data-testid="reg-grad" /></div>
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5" data-testid="reg-phone" /></div>
        </div>
        <div><Label htmlFor="skills">Skills / interests (comma separated)</Label><Input id="skills" value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="React, Python, SQL" className="mt-1.5" data-testid="reg-skills" /></div>
        <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800" data-testid="register-submit">{loading ? "Creating…" : "Create account"}</Button>
      </form>
    </AuthShell>
  );
}
