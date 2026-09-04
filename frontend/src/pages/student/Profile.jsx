import { useEffect, useState } from "react";
import { api, apiError } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({
      full_name: user.name || "", college: user.college || "", degree: user.degree || "",
      graduation_year: user.graduation_year || "", skills: (user.skills || []).join(", "),
      bio: user.bio || "", github: user.github || "", linkedin: user.linkedin || "", portfolio: user.portfolio || "",
    });
  }, [user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/profile", {
        full_name: form.full_name, college: form.college, degree: form.degree,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        bio: form.bio, github: form.github, linkedin: form.linkedin, portfolio: form.portfolio,
      });
      await refresh();
      toast.success("Profile updated");
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  };

  if (!form) return <DashboardLayout title="Profile" />;

  return (
    <DashboardLayout title="Profile">
      <div className="mx-auto max-w-2xl">
        {user?.public_username && (
          <Link to={`/students/${user.public_username}`} className="mb-6 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300" data-testid="view-portfolio-link">
            <ExternalLink className="h-4 w-4" /> View public portfolio
          </Link>
        )}
        <form onSubmit={save} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="mt-1.5" data-testid="profile-name" /></div>
          <div><Label>Email</Label><Input value={user.email} disabled className="mt-1.5 bg-slate-50" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>College</Label><Input value={form.college} onChange={(e) => set("college", e.target.value)} className="mt-1.5" data-testid="profile-college" /></div>
            <div><Label>Degree</Label><Input value={form.degree} onChange={(e) => set("degree", e.target.value)} className="mt-1.5" data-testid="profile-degree" /></div>
          </div>
          <div><Label>Graduation year</Label><Input type="number" value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} className="mt-1.5" data-testid="profile-grad" /></div>
          <div><Label>Skills (comma separated)</Label><Input value={form.skills} onChange={(e) => set("skills", e.target.value)} className="mt-1.5" data-testid="profile-skills" /></div>
          <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} className="mt-1.5" data-testid="profile-bio" /></div>
          <div className="grid grid-cols-1 gap-3">
            <div><Label>GitHub URL</Label><Input value={form.github} onChange={(e) => set("github", e.target.value)} className="mt-1.5" data-testid="profile-github" /></div>
            <div><Label>LinkedIn URL</Label><Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} className="mt-1.5" data-testid="profile-linkedin" /></div>
            <div><Label>Portfolio website</Label><Input value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} className="mt-1.5" data-testid="profile-portfolio" /></div>
          </div>
          <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800" data-testid="save-profile-btn">{saving ? "Saving…" : "Save changes"}</Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
