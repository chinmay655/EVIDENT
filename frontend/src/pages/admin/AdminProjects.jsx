import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, MoreVertical, Users } from "lucide-react";

export default function AdminProjects() {
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState("All");
  const nav = useNavigate();

  const load = useCallback(async () => {
    setItems(null);
    const { data } = await api.get("/admin/projects", { params: { status } });
    setItems(data.items);
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const act = async (id, action) => {
    try {
      await api.post(`/admin/projects/${id}/${action}`);
      toast.success(`Project ${action}ed`);
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <AdminLayout title="Projects">
      <div className="mb-6 flex items-center justify-between">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44" data-testid="project-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>{["All", "draft", "published", "archived"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
        <Button asChild className="bg-slate-900 hover:bg-slate-800" data-testid="new-project-btn"><Link to="/admin/projects/new"><Plus className="mr-2 h-4 w-4" /> New Project</Link></Button>
      </div>

      {!items ? <Loading /> : items.length === 0 ? (
        <EmptyState title="No projects" description="Create your first project to get started."
          action={<Button asChild className="bg-slate-900"><Link to="/admin/projects/new">New Project</Link></Button>} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Enrolled</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0 hover:bg-slate-50" data-testid={`admin-project-${p.slug}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                  <td className="px-4 py-3 text-slate-600">{p.category}</td>
                  <td className="px-4 py-3 text-slate-600">₹{p.price}</td>
                  <td className="px-4 py-3 text-slate-600">v{p.current_version}</td>
                  <td className="px-4 py-3 text-slate-600"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.enrollment_count}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button className="rounded p-1 hover:bg-slate-200" data-testid={`project-menu-${p.slug}`}><MoreVertical className="h-4 w-4" /></button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => nav(`/admin/projects/${p.id}/edit`)} data-testid={`project-edit-${p.slug}`}>Edit</DropdownMenuItem>
                        {p.status !== "published" && <DropdownMenuItem onClick={() => act(p.id, "publish")}>Publish</DropdownMenuItem>}
                        {p.status === "published" && <DropdownMenuItem onClick={() => act(p.id, "unpublish")}>Unpublish</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => act(p.id, "feature")}>{p.featured ? "Unfeature" : "Feature"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => act(p.id, "duplicate")}>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => act(p.id, "archive")} className="text-red-600">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
