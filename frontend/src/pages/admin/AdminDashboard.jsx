import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, StatCard } from "@/components/common";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, GraduationCap, CheckCircle2, IndianRupee, FileCheck2, RefreshCw, MessageSquare, Award,
} from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then(({ data }) => setData(data)); }, []);

  if (!data) return <AdminLayout title="Overview"><Loading /></AdminLayout>;
  const s = data.stats;

  return (
    <AdminLayout title="Overview">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Students" value={s.total_students} icon={Users} testId="admin-stat-students" />
          <StatCard label="Active Enrollments" value={s.active_enrollments} icon={GraduationCap} testId="admin-stat-active" />
          <StatCard label="Completed" value={s.completed_projects} icon={CheckCircle2} testId="admin-stat-completed" />
          <StatCard label="Revenue" value={`₹${s.revenue.toLocaleString()}`} icon={IndianRupee} testId="admin-stat-revenue" />
          <StatCard label="Pending Reviews" value={s.pending_submissions} icon={FileCheck2} testId="admin-stat-pending" />
          <StatCard label="Revision Requests" value={s.revision_requests} icon={RefreshCw} />
          <StatCard label="Open Questions" value={s.open_questions} icon={MessageSquare} />
          <StatCard label="Certificates" value={s.certificates_issued} icon={Award} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Enrollments (last 30 days)">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.enrollments_series}>
                <defs><linearGradient id="e" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(d) => d.slice(5)} interval={6} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#e)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Revenue (last 30 days)">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenue_series}>
                <defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} /><stop offset="95%" stopColor="#16a34a" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(d) => d.slice(5)} interval={6} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={40} />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Area type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2} fill="url(#r)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Project popularity">
            {data.popularity.length === 0 ? <p className="py-16 text-center text-sm text-slate-400">No enrollment data yet.</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.popularity} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="project" tick={{ fontSize: 11, fill: "#64748b" }} width={140} />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          <ChartCard title="Recent activity">
            <div className="max-h-[260px] space-y-2 overflow-y-auto">
              {data.recent_activity.length === 0 ? <p className="py-16 text-center text-sm text-slate-400">No activity yet.</p> :
                data.recent_activity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0">
                    <span className="capitalize text-slate-700">{a.action.replace(/_/g, " ")}</span>
                    <span className="text-xs text-slate-400">{a.actor_email || "system"}</span>
                  </div>
                ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
}

const ChartCard = ({ title, children }) => (
  <div className="rounded-lg border border-zinc-200 bg-white p-5">
    <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
    {children}
  </div>
);
