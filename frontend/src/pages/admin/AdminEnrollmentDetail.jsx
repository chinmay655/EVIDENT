import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, apiError, API, fileUrl } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FileText, Award, CalendarClock, Ban } from "lucide-react";

export default function AdminEnrollmentDetail() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(() => api.get(`/admin/enrollments/${id}`).then(({ data }) => setD(data)), [id]);
  useEffect(() => { load(); }, [load]);

  const extend = async () => {
    try { await api.post(`/admin/enrollments/${id}/extend-deadline`, { due_date: new Date(newDate).toISOString(), reason }); toast.success("Deadline extended"); load(); }
    catch (e) { toast.error(apiError(e)); }
  };
  const cancel = async () => { try { await api.post(`/admin/enrollments/${id}/cancel`); toast.success("Enrollment cancelled"); load(); } catch (e) { toast.error(apiError(e)); } };
  const issueCert = async () => { try { const { data } = await api.post(`/admin/enrollments/${id}/issue-certificate`); toast.success("Certificate issued: " + data.certificate_id); load(); } catch (e) { toast.error(apiError(e)); } };

  if (!d) return <AdminLayout title="Enrollment"><Loading /></AdminLayout>;
  const e = d.enrollment;

  return (
    <AdminLayout title="Enrollment Detail">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">{d.project}</h2><StatusBadge status={e.status} /></div>
            <p className="mt-1 text-sm text-slate-500">{d.student.name} · {d.student.email} · Version {e.project_version}</p>
            <div className="mt-4"><div className="flex justify-between text-sm text-slate-600"><span>Progress</span><span>{d.progress.required_approved}/{d.progress.required_total} approved</span></div><Progress value={d.progress.percent} className="mt-2 h-2" /></div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="text-slate-500">Payment: <StatusBadge status={e.payment_status} /></span>
              {e.due_date && <span className="text-slate-500">Due: {new Date(e.due_date).toLocaleDateString()}</span>}
            </div>
            {d.resume_file_id && <a href={fileUrl(d.resume_file_id)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline" data-testid="view-resume"><FileText className="h-4 w-4" /> View resume</a>}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Submissions ({d.submissions.length})</h3>
            {d.submissions.length === 0 ? <p className="mt-3 text-sm text-slate-400">No submissions yet.</p> : (
              <div className="mt-4 space-y-3">
                {d.submissions.map((s) => (
                  <Link key={s.id} to={`/admin/submissions/${s.id}`} className="flex items-center justify-between rounded-md border border-zinc-200 p-3 hover:border-slate-300">
                    <div><p className="text-sm font-medium text-slate-800">Submission #{s.version}</p><p className="text-xs text-slate-500">{s.github_url}</p></div>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {d.deadline_history?.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">Deadline history</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">{d.deadline_history.map((h, i) => <li key={i} className="border-b border-zinc-100 pb-2">Extended to {new Date(h.new).toLocaleDateString()} by {h.by} — {h.reason || "no reason"}</li>)}</ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Admin actions</h3>
            <div className="mt-4 space-y-2">
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" className="w-full justify-start" data-testid="extend-deadline-btn"><CalendarClock className="mr-2 h-4 w-4" /> Extend deadline</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Extend deadline</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>New due date</Label><Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-1.5" data-testid="new-deadline-input" /></div>
                    <div><Label>Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5" /></div>
                  </div>
                  <DialogFooter><Button onClick={extend} className="bg-slate-900" data-testid="confirm-extend">Extend</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="w-full justify-start" onClick={issueCert} data-testid="issue-cert-btn"><Award className="mr-2 h-4 w-4" /> Issue certificate</Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" onClick={cancel} data-testid="cancel-enrollment-btn"><Ban className="mr-2 h-4 w-4" /> Cancel enrollment</Button>
            </div>
          </div>
          {d.certificate && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">Certificate</h3>
              <p className="mt-2 text-sm text-slate-500">{d.certificate.certificate_id}</p>
              <StatusBadge status={d.certificate.status} />
              <a href={`${API}/certificates/${d.certificate.id}/download`} className="mt-3 block text-sm text-blue-600 hover:underline">Download PDF</a>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
