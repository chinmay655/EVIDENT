import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loading, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const [data, setData] = useState(null);
  const nav = useNavigate();

  const load = () => api.get("/notifications").then(({ data }) => setData(data));
  useEffect(() => { load(); }, []);

  const markAll = async () => { await api.post("/notifications/read-all"); load(); };
  const open = async (n) => { await api.patch(`/notifications/${n.id}/read`); if (n.link) nav(n.link); else load(); };

  return (
    <DashboardLayout title="Notifications">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll} data-testid="notif-mark-all">Mark all read</Button>
        </div>
        {!data ? <Loading /> : data.items.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up." icon={Bell} testId="notif-empty" />
        ) : (
          <div className="space-y-2">
            {data.items.map((n) => (
              <button key={n.id} onClick={() => open(n)} data-testid={`notif-${n.id}`}
                className={cn("block w-full rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-slate-300", !n.read && "border-blue-200 bg-blue-50/40")}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                </div>
                <p className="mt-1 text-sm text-slate-500">{n.message}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
