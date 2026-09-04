import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, EmptyState } from "@/components/common";
import { ScrollText } from "lucide-react";

export default function AdminAudit() {
  const [items, setItems] = useState(null);
  useEffect(() => { api.get("/admin/audit-logs").then(({ data }) => setItems(data.items)); }, []);

  return (
    <AdminLayout title="Audit Log">
      {!items ? <Loading /> : items.length === 0 ? <EmptyState title="No audit entries" icon={ScrollText} /> : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">IP</th></tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={i} className="border-b border-zinc-100 last:border-0" data-testid={`audit-row-${i}`}>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(a.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium capitalize text-slate-800">{a.action.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-slate-600">{a.actor_email || "—"} {a.role && <span className="text-xs text-slate-400">({a.role})</span>}</td>
                  <td className="px-4 py-3 text-slate-600">{a.entity}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{a.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
