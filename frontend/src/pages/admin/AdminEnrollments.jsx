import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

export default function AdminEnrollments() {
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState("All");
  const nav = useNavigate();

  const load = useCallback(async () => {
    setItems(null);
    const { data } = await api.get("/admin/enrollments", { params: { status } });
    setItems(data.items);
  }, [status]);
  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout title="Enrollments">
      <div className="mb-6">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52" data-testid="enrollment-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>{["All", "active", "pending_payment", "under_review", "revision_required", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {!items ? <Loading /> : items.length === 0 ? <EmptyState title="No enrollments" /> : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} onClick={() => nav(`/admin/enrollments/${e.id}`)} className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-slate-50" data-testid={`enrollment-row-${e.id}`}>
                  <td className="px-4 py-3"><p className="font-medium text-slate-900">{e.student}</p><p className="text-xs text-slate-500">{e.student_email}</p></td>
                  <td className="px-4 py-3 text-slate-600">{e.project} <span className="text-xs text-slate-400">v{e.version}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Progress value={e.progress} className="h-1.5 w-20" /><span className="text-xs text-slate-500">{e.progress}%</span>{e.overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}</div></td>
                  <td className="px-4 py-3"><StatusBadge status={e.payment_status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
