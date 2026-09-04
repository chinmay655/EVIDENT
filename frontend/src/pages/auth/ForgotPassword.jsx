import { useState } from "react";
import { Link } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      toast.success(data.message);
      setSent(true);
    } catch (err) { toast.error(apiError(err)); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a reset link."
      footer={<Link to="/login" className="font-medium text-blue-600 hover:underline">Back to login</Link>}>
      {sent ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" data-testid="forgot-sent">
          If an account exists for {email}, a reset link has been sent. Check your inbox.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" data-testid="forgot-email" /></div>
          <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800" data-testid="forgot-submit">{loading ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
