import { useState } from "react";
import { api, apiError } from "@/lib/apiClient";
import { PublicLayout } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post("/contact", form);
      toast.success(data.message || "Message sent!");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-6 py-16 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white"><Mail className="h-5 w-5" /></div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact us</h1>
        </div>
        <p className="mt-3 text-slate-600">Questions about a project, your enrollment, or a refund? Send us a message.</p>
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
          <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required className="mt-1.5" data-testid="contact-name" /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className="mt-1.5" data-testid="contact-email" /></div>
          <div><Label htmlFor="msg">Message</Label><Textarea id="msg" value={form.message} onChange={(e) => set("message", e.target.value)} required rows={5} className="mt-1.5" data-testid="contact-message" /></div>
          <Button type="submit" disabled={sending} className="bg-slate-900 hover:bg-slate-800" data-testid="contact-submit">{sending ? "Sending…" : "Send message"}</Button>
        </form>
      </div>
    </PublicLayout>
  );
}
