import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function Page({ title, subtitle, children }) {
  return (
    <PublicLayout>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-3 text-lg text-slate-600">{subtitle}</p>}
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">{children}</div>
    </PublicLayout>
  );
}

const Prose = ({ blocks }) => (
  <div className="space-y-6">
    {blocks.map(([h, b], i) => (
      <div key={i}>
        {h && <h2 className="text-xl font-semibold text-slate-900">{h}</h2>}
        <p className="mt-2 leading-relaxed text-slate-600">{b}</p>
      </div>
    ))}
  </div>
);

export function About() {
  return (
    <Page title="About EVIDENT" subtitle="A project experience platform — not a course marketplace.">
      <Prose blocks={[
        ["Why we exist", "Students are constantly told they lack practical experience, yet rarely given a structured way to gain it. EVIDENT closes that gap by letting students complete realistic projects and produce verifiable evidence of the work they did."],
        ["What makes us different", "We don't sell video lectures. Every project is framed like real client or company work, with structured tasks, resources, human review, and a revision workflow. The outcome is proof — a GitHub-backed evidence page and a verifiable certificate."],
        ["Our principle", "The certificate is not the value. The project work and the verifiable evidence are. That evidence is what helps a student answer 'what did you actually build?' with confidence."],
      ]} />
    </Page>
  );
}

export function HowItWorks() {
  const steps = [
    ["Discover a project", "Browse the catalog and pick a project that matches the role you're targeting."],
    ["Enroll & upload resume", "Create an account, upload your resume, and secure your workspace with a one-time payment."],
    ["Build with structure", "Work through guided tasks using real tools, with resources and the ability to ask questions."],
    ["Submit your work", "Share your GitHub repository, deployed URL, and a write-up of what you built."],
    ["Get reviewed", "A reviewer evaluates your work against clear criteria and either approves or requests revisions."],
    ["Get verified", "Once approved, your certificate and public evidence page are generated with a verification ID."],
  ];
  return (
    <Page title="How It Works" subtitle="From discovery to verifiable evidence in six steps.">
      <ol className="space-y-4">
        {steps.map(([t, d], i) => (
          <li key={i} className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{i + 1}</span>
            <div><p className="font-semibold text-slate-900">{t}</p><p className="mt-1 text-slate-600">{d}</p></div>
          </li>
        ))}
      </ol>
      <div className="mt-10 text-center">
        <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800"><Link to="/projects" data-testid="how-explore-btn">Explore Projects</Link></Button>
      </div>
    </Page>
  );
}

export function FAQ() {
  const faqs = [
    ["Is EVIDENT an online course platform?", "No. It's a project experience platform. You complete real projects and produce verifiable evidence — not watch lectures."],
    ["What do I receive when I complete a project?", "A GitHub-backed evidence page, human feedback, and a verifiable completion certificate with a unique verification ID."],
    ["Do I need to pay before accessing project content?", "Yes. Public project info is free to browse, but tasks, resources, and the workspace unlock only after a verified payment."],
    ["Can I use a test payment?", "In development/demo mode a clearly marked sandbox payment is available so you can experience the full flow."],
    ["Is my resume kept private?", "Yes. Resumes are stored in private cloud storage and are never exposed publicly."],
    ["What happens if my submission needs changes?", "You'll receive feedback and can resubmit. Every submission version is retained for you and the reviewer."],
    ["How does certificate verification work?", "Each certificate has a unique verification ID and QR code that anyone can use to confirm its validity on the public verification page."],
  ];
  return (
    <Page title="Frequently Asked Questions" subtitle="Everything you need to know about how EVIDENT works.">
      <Accordion type="single" collapsible>
        {faqs.map(([q, a], i) => (
          <AccordionItem key={i} value={`f${i}`} data-testid={`faq-item-${i}`}>
            <AccordionTrigger className="text-left text-base font-medium">{q}</AccordionTrigger>
            <AccordionContent className="text-slate-600">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy Policy">
      <Prose blocks={[
        ["Data we collect", "We collect account information (name, email, education details), your uploaded resume, and records of your enrollments, submissions, and certificates."],
        ["How we use your data", "Your data is used to operate the platform: managing enrollments, reviewing submissions, issuing certificates, and communicating with you about your projects."],
        ["Resume privacy", "Resumes are stored in private cloud storage and are only accessible to you and authorized administrators. They are never exposed on public URLs."],
        ["Public information", "Only information you explicitly choose to make public (such as an evidence page) is visible to others. Your email, phone, resume, and payment data are never public."],
        ["Account deletion", "You may request account deletion, subject to legal and financial record-retention requirements."],
      ]} />
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of Service">
      <Prose blocks={[
        ["Acceptance", "By using EVIDENT you agree to these terms. If you do not agree, do not use the platform."],
        ["Enrollments & payments", "Project access is granted only after a verified payment. Prices are determined by the platform and shown before purchase."],
        ["Your work", "You retain ownership of the code and work you create. You grant us permission to review it and to display evidence you choose to make public."],
        ["Certificates", "Certificates verify completion of a specific project on this platform. We do not claim university accreditation unless explicitly stated."],
        ["Acceptable use", "You must not attempt to bypass access controls, tamper with payments, or access other users' data."],
      ]} />
    </Page>
  );
}

export function RefundPolicy() {
  return (
    <Page title="Refund Policy">
      <Prose blocks={[
        ["Overview", "Because project workspaces, tasks, and resources unlock immediately upon enrollment, purchases are generally non-refundable once workspace content has been accessed."],
        ["Eligibility", "If you have not accessed any private project content, you may request a refund within 7 days of purchase by contacting support."],
        ["How to request", "Email us via the Contact page with your account email and the project name. We review each request individually."],
        ["Processing", "Approved refunds are processed to the original payment method and may take several business days to appear."],
      ]} />
    </Page>
  );
}

export function NotFound() {
  return (
    <Page title="Page not found" subtitle="The page you're looking for doesn't exist.">
      <Button asChild className="bg-slate-900"><Link to="/">Back to home</Link></Button>
    </Page>
  );
}
