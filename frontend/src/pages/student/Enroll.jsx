import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loading } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadCloud, FileText, CheckCircle2, Lock, ShieldCheck } from "lucide-react";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Enroll() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { api.get(`/projects/${slug}`).then(({ data }) => setProject(data)).catch(() => nav("/projects")); }, [slug, nav]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/files/upload?category=resume", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResume(data);
      toast.success("Resume uploaded");
    } catch (err) { toast.error(apiError(err)); }
    finally { setUploading(false); }
  };

  const pay = async () => {
    if (!resume) return toast.error("Upload your resume first");
    if (!accepted) return toast.error("Please accept the terms");
    setProcessing(true);
    try {
      const { data: enr } = await api.post("/enrollments", { project_id: project.id, resume_file_id: resume.file_id, accept_terms: true });
      const eid = enr.enrollment_id;
      const { data: order } = await api.post("/payments/create-order", { enrollment_id: eid });

      const finish = async (verifyPayload) => {
        try {
          await api.post("/payments/verify", { enrollment_id: eid, ...verifyPayload });
          toast.success("Payment verified — workspace unlocked!");
          nav(`/workspace/${eid}`);
        } catch (err) { toast.error(apiError(err)); setProcessing(false); }
      };

      if (order.sandbox) {
        // Clearly-marked sandbox/test payment
        await finish({ sandbox: true });
      } else {
        const ok = await loadRazorpay();
        if (!ok) { toast.error("Could not load payment gateway"); setProcessing(false); return; }
        const rzp = new window.Razorpay({
          key: order.key_id, amount: order.amount, currency: order.currency,
          name: "EVIDENT", description: order.name, order_id: order.order_id,
          prefill: { name: order.prefill_name, email: order.prefill_email },
          theme: { color: "#0f172a" },
          handler: (resp) => finish({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          }),
          modal: { ondismiss: () => setProcessing(false) },
        });
        rzp.open();
      }
    } catch (err) { toast.error(apiError(err)); setProcessing(false); }
  };

  if (!project) return <DashboardLayout title="Enroll"><Loading /></DashboardLayout>;

  return (
    <DashboardLayout title="Enroll">
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Complete your enrollment</h2>
            <p className="mt-1 text-slate-500">{project.title}</p>
          </div>

          {/* Resume upload */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">1</span><h3 className="font-semibold text-slate-900">Upload your resume</h3><span className="text-xs text-red-500">*required</span></div>
            <p className="mt-2 text-sm text-slate-500">PDF or DOCX, up to 15MB. Your resume is private and never shown publicly.</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-slate-50 py-8 hover:border-slate-400" data-testid="resume-dropzone">
              {resume ? (
                <div className="flex items-center gap-2 text-emerald-700"><FileText className="h-5 w-5" /><span className="text-sm font-medium">{resume.filename}</span><CheckCircle2 className="h-4 w-4" /></div>
              ) : (
                <><UploadCloud className="h-6 w-6 text-slate-400" /><span className="mt-2 text-sm text-slate-600">{uploading ? "Uploading…" : "Click to upload resume"}</span></>
              )}
              <input type="file" accept=".pdf,.docx" className="hidden" onChange={onFile} data-testid="resume-input" />
            </label>
          </div>

          {/* Terms */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">2</span><h3 className="font-semibold text-slate-900">Accept terms</h3></div>
            <div className="mt-4 flex items-start gap-3">
              <Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} data-testid="accept-terms" />
              <Label htmlFor="terms" className="text-sm font-normal text-slate-600">I agree to the Terms of Service and understand project workspace content unlocks immediately after payment.</Label>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.12em] font-semibold text-slate-500">Order summary</p>
            <p className="mt-3 font-semibold text-slate-900">{project.title}</p>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
              <span className="text-slate-600">Total</span>
              <span className="text-2xl font-bold text-slate-900">{project.currency === "INR" ? "₹" : ""}{project.price}</span>
            </div>
            <Button onClick={pay} disabled={processing || !resume || !accepted} className="mt-5 w-full bg-slate-900 hover:bg-slate-800" size="lg" data-testid="pay-button">
              {processing ? "Processing…" : <>Pay {project.currency === "INR" ? "₹" : ""}{project.price}</>}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400"><Lock className="h-3 w-3" /> Payment secured. Price verified server-side.</p>
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              <ShieldCheck className="mb-1 inline h-3.5 w-3.5" /> Sandbox/test mode is active when live keys aren't configured — the full flow works without real charges.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
