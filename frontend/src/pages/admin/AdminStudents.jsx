import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, EmptyState } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdminStudents() {
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/students", { params: search ? { search } : {} });
    setItems(data.items);
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  return (
    <AdminLayout title="Students">
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, college" className="pl-9" data-testid="student-search" />
      </div>
      {!items ? <Loading /> : items.length === 0 ? <EmptyState title="No students found" /> : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">College</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">Certs</th></tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 last:border-0 hover:bg-slate-50" data-testid={`student-row-${s.id}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.email}</td>
                  <td className="px-4 py-3 text-slate-600">{s.college || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.active_enrollments}</td>
                  <td className="px-4 py-3 text-slate-600">{s.completed}</td>
                  <td className="px-4 py-3 text-slate-600">{s.certificates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
