import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminSubmissions() {
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState("submitted");
  const nav = useNavigate();

  const load = useCallback(async () => {
    setItems(null);
    const { data } = await api.get("/admin/submissions", { params: { status } });
    setItems(data.items);
  }, [status]);
  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout title="Submissions">
      <div className="mb-6">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52" data-testid="submission-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>{["All", "submitted", "under_review", "revision_required", "approved", "rejected"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {!items ? <Loading /> : items.length === 0 ? <EmptyState title="No submissions" description="Submissions awaiting review will appear here." /> : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">GitHub</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} onClick={() => nav(`/admin/submissions/${s.id}`)} className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-slate-50" data-testid={`submission-row-${s.id}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{s.student}</td>
                  <td className="px-4 py-3 text-slate-600">{s.project}</td>
                  <td className="px-4 py-3 text-slate-600">#{s.version}</td>
                  <td className="px-4 py-3 max-w-[220px] truncate text-blue-600">{s.github_url}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
