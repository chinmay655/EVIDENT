import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { PublicLayout } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/common";
import { ShieldCheck, ShieldX, ShieldAlert, Search } from "lucide-react";

export default function Verify() {
  const { verificationId } = useParams();
  const nav = useNavigate();
  const [id, setId] = useState(verificationId || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async (vid) => {
    if (!vid) return;
    setLoading(true); setResult(null);
    try { const { data } = await api.get(`/verify/${vid}`); setResult(data); }
    catch { setResult({ valid: false, status: "not_found", message: "No certificate found" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (verificationId) check(verificationId); }, [verificationId]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-6 py-16 lg:px-8">
        <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900">Verify a Certificate</h1>
        <p className="mt-3 text-center text-slate-600">Enter a certificate verification ID to confirm its authenticity.</p>

        <form onSubmit={(e) => { e.preventDefault(); nav(`/verify/${id.trim()}`); }} className="mt-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="Verification ID" className="pl-9" data-testid="verify-input" />
          </div>
          <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="verify-submit">Verify</Button>
        </form>

        {loading && <Loading label="Verifying…" />}

        {result && !loading && (
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 text-center animate-fade-in" data-testid="verify-result">
            {result.valid ? (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"><ShieldCheck className="h-7 w-7 text-emerald-600" /></div>
                <p className="mt-4 text-lg font-semibold text-emerald-700">Valid Certificate</p>
                <div className="mt-6 space-y-3 text-left">
                  <Row label="Student" value={result.student_name} />
                  <Row label="Project" value={result.project_title} />
                  <Row label="Category" value={result.category} />
                  <Row label="Completed" value={result.completion_date} />
                  <Row label="Certificate ID" value={result.certificate_id} />
                  {result.skills?.length > 0 && <Row label="Skills" value={result.skills.join(", ")} />}
                </div>
              </>
            ) : result.status === "revoked" ? (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><ShieldX className="h-7 w-7 text-red-600" /></div>
                <p className="mt-4 text-lg font-semibold text-red-700">Certificate Revoked</p>
                <p className="mt-2 text-sm text-slate-500">This certificate has been revoked and is no longer valid.</p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50"><ShieldAlert className="h-7 w-7 text-amber-600" /></div>
                <p className="mt-4 text-lg font-semibold text-amber-700">Not Valid</p>
                <p className="mt-2 text-sm text-slate-500">{result.message || "No matching certificate found."}</p>
              </>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-zinc-100 pb-3">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-900">{value}</span>
  </div>
);
