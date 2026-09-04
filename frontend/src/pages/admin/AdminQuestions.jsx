import { useEffect, useState, useCallback } from "react";
import { api, apiError } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

export default function AdminQuestions() {
  const [items, setItems] = useState(null);
  const [answers, setAnswers] = useState({});

  const load = useCallback(() => api.get("/admin/questions").then(({ data }) => setItems(data.items)), []);
  useEffect(() => { load(); }, [load]);

  const answer = async (q) => {
    const text = answers[q.id];
    if (!text?.trim()) return toast.error("Write an answer");
    try { await api.post(`/admin/questions/${q.id}/answer`, { answer: text }); toast.success("Answer sent"); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <AdminLayout title="Questions">
      {!items ? <Loading /> : items.length === 0 ? <EmptyState title="No questions" icon={MessageSquare} /> : (
        <div className="space-y-4">
          {items.map((q) => (
            <div key={q.id} className="rounded-lg border border-zinc-200 bg-white p-6" data-testid={`question-${q.id}`}>
              <div className="flex items-center justify-between">
                <div><p className="font-semibold text-slate-900">{q.subject}</p><p className="text-xs text-slate-500">{q.student_name}</p></div>
                <StatusBadge status={q.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{q.message}</p>
              {q.answer ? (
                <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-slate-700"><p className="text-xs font-semibold text-emerald-700">Your answer</p><p className="mt-1">{q.answer}</p></div>
              ) : (
                <div className="mt-4">
                  <Textarea value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="Write your answer…" rows={2} data-testid={`answer-input-${q.id}`} />
                  <Button onClick={() => answer(q)} className="mt-2 bg-slate-900 hover:bg-slate-800" size="sm" data-testid={`answer-btn-${q.id}`}>Send answer</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
