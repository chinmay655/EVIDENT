import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { PublicLayout } from "@/components/PublicNav";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Compass,
  FileCheck2,
  FolderGit2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

const STEPS = [
  {
    icon: Compass,
    title: "Choose a Project",
    text: "Browse practical projects that match your interests and career goals.",
  },
  {
    icon: Code2,
    title: "Build & Submit",
    text: "Work through the project tasks and submit the solution you created.",
  },
  {
    icon: MessageSquare,
    title: "Get Expert Feedback",
    text: "Receive structured feedback on the work you submitted.",
  },
  {
    icon: BadgeCheck,
    title: "Earn a Certificate",
    text: "Complete the project successfully and receive verifiable proof.",
  },
];

const WHY_EVIDENT = [
  {
    icon: BriefcaseBusiness,
    title: "Practical projects",
    text: "Work on structured scenarios instead of only consuming lessons.",
  },
  {
    icon: ClipboardCheck,
    title: "Real evaluation",
    text: "Your submitted work can be reviewed against project requirements.",
  },
  {
    icon: FolderGit2,
    title: "Portfolio evidence",
    text: "Connect your completed work to GitHub-backed evidence.",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable completion",
    text: "Approved project work can receive a certificate and verification page.",
  },
];

const FAQS = [
  [
    "Is EVIDENT an online course?",
    "No. EVIDENT is a project experience platform. You complete structured projects, submit your work and receive evaluation instead of simply watching lessons.",
  ],
  [
    "Is this an internship?",
    "No. EVIDENT is not employment or an internship. It is designed to help students build practical project evidence they can accurately discuss during applications and interviews.",
  ],
  [
    "What do I receive?",
    "You receive a project brief, structured tasks, resources, evaluation and feedback, GitHub-backed evidence and, when approved, a verifiable completion certificate.",
  ],
  [
    "Do I need prior experience?",
    "It depends on the project. Each project displays its requirements and difficulty so you can choose an appropriate starting point.",
  ],
  [
    "How is my work verified?",
    "Your submission is evaluated against the project's requirements. Approved work can receive a verification record and certificate.",
  ],
  [
    "Can I put the project on my resume?",
    "Yes. You can describe completed work accurately as project experience and use the resulting evidence when discussing your skills.",
  ],
];

function HeroCheck({ children, icon: Icon = CheckCircle2 }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Icon className="h-4 w-4 shrink-0 text-blue-600" />
      <span>{children}</span>
    </div>
  );
}

function ProcessStep({ step, index }) {
  const Icon = step.icon;

  return (
    <div className="relative flex flex-1 flex-col items-center text-center">
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-white shadow-sm">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-950">
        {index + 1}. {step.title}
      </h3>

      <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
        {step.text}
      </p>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .get("/projects", {
        params: {
          featured: true,
          limit: 4,
        },
      })
      .then(({ data }) => {
        if (active) setFeatured(data?.items || []);
      })
      .catch(() => {
        if (active) setFeatured([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PublicLayout>
      <main className="overflow-hidden bg-white">

        {/* =====================================================
            HERO
        ===================================================== */}
        <section className="relative overflow-hidden bg-[#f7faff]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-36 -top-32 h-[30rem] w-[30rem] rounded-full bg-blue-100/70 blur-3xl" />
            <div className="absolute right-[-8rem] top-[-9rem] h-[34rem] w-[34rem] rounded-full bg-purple-100/70 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-sky-100/60 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-10 sm:pb-14 lg:px-8 lg:pb-12 lg:pt-12">
            <div className="grid items-center gap-7 lg:grid-cols-[0.88fr_1.12fr] lg:gap-8">

              {/* LEFT */}
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                  </span>
                  Real Projects. Real Skills. Real Recognition.
                </div>

                <h1 className="mt-6 text-5xl font-bold leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-[4.2rem] xl:text-[4.55rem]">
                  Turn Your Learning
                  <span className="block">Into Real-World</span>
                  <span className="block text-blue-600">Experience.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  Work on industry-style projects, build practical skills,
                  create verifiable evidence, and earn certificates that
                  strengthen the story behind your resume.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-xl bg-slate-950 px-6 font-semibold shadow-lg shadow-slate-900/10 hover:bg-blue-700"
                  >
                    <Link to="/projects">
                      Explore Projects
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl border-slate-300 bg-white px-5 font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <Link to="/how-it-works">
                      <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                        <ArrowRight className="h-3 w-3" />
                      </span>
                      How It Works
                    </Link>
                  </Button>
                </div>

                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                  <HeroCheck>Industry-aligned projects</HeroCheck>
                  <HeroCheck icon={ShieldCheck}>Verified certificates</HeroCheck>
                  <HeroCheck icon={FolderGit2}>Build your portfolio</HeroCheck>
                </div>
              </div>

              {/* RIGHT HERO VISUAL */}
              <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-100/70 blur-3xl" />

                <div className="relative min-h-[430px] sm:min-h-[480px]">
                  {/* Decorative blobs */}
                  <div className="absolute left-[13%] top-[5%] h-40 w-40 rounded-full bg-blue-100/70 blur-2xl" />
                  <div className="absolute right-[5%] top-[8%] h-52 w-52 rounded-[45%] bg-purple-100/80 blur-2xl" />

                  {/* Main image */}
                  <div className="absolute bottom-5 left-[7%] right-[4%] top-8 overflow-hidden rounded-[2.4rem] border-[10px] border-white bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
                    <img
                      src="https://images.unsplash.com/photo-1513258496099-48168024aec0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400"
                      alt="Student working on a project"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                  </div>

                  {/* Work on real projects */}
                  <div className="absolute left-0 top-20 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:left-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                        <BriefcaseBusiness className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">WORK ON</p>
                        <p className="text-sm font-semibold text-slate-900">
                          Real Projects
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Build skills */}
                  <div className="absolute left-[-2%] top-48 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">BUILD</p>
                        <p className="text-sm font-semibold text-slate-900">
                          Practical Skills
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Earn certificates */}
                  <div className="absolute right-[-1%] top-52 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">EARN</p>
                        <p className="text-sm font-semibold text-slate-900">
                          Certificates
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right message */}
                  <div className="absolute right-[-1%] top-2 hidden w-44 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-lg backdrop-blur sm:block">
                    <p className="text-sm font-bold leading-5 text-slate-950">
                      Same Skills.
                      <br />
                      Different Results.
                    </p>

                    <div className="mt-3 space-y-2">
                      <HeroCheck>Real Projects</HeroCheck>
                      <HeroCheck>Real Feedback</HeroCheck>
                      <HeroCheck>Real Opportunities</HeroCheck>
                    </div>
                  </div>

                  {/* Bottom image card */}
                  <div className="absolute bottom-0 left-[18%] right-[10%] rounded-2xl border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                        <Code2 className="h-5 w-5 text-white" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                          YOUR PROJECT
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900">
                          Build something you can show
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Build
                      </span>
                    </div>
                  </div>

                  {/* Verification card */}
                  <div className="absolute bottom-[-24px] left-[4%] hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:block">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          PROJECT STATUS
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          Work can be verified
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FOUR VALUE ITEMS
        ===================================================== */}
        <section className="border-y border-slate-200 bg-[#f7faff]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-200 px-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:px-8">
            {[
              [
                BriefcaseBusiness,
                "Practical Projects",
                "From real-world scenarios",
              ],
              [MessageSquare, "Expert Feedback", "Get structured reviews"],
              [BadgeCheck, "Recognized Certificates", "Showcase your achievements"],
              [Users, "Career Growth", "Stand out with real work"],
            ].map(([Icon, title, text]) => (
              <div key={title} className="flex items-center gap-4 py-6 sm:px-7">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            FEATURED PROJECTS
        ===================================================== */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Featured Projects
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Explore real-world projects
                </h2>
                <p className="mt-2 max-w-2xl text-slate-500">
                  Explore practical projects and start building experience
                  around the skills you want to demonstrate.
                </p>
              </div>

              <Link
                to="/projects"
                className="hidden shrink-0 items-center text-sm font-semibold text-blue-600 sm:inline-flex"
              >
                View All Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-[370px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                  />
                ))}
              </div>
            ) : featured.length > 0 ? (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                  <BriefcaseBusiness className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">
                  Projects are being prepared
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Visit the project catalog to see currently available work.
                </p>
                <Button
                  asChild
                  className="mt-5 rounded-xl bg-slate-950 hover:bg-blue-700"
                >
                  <Link to="/projects">Browse Projects</Link>
                </Button>
              </div>
            )}

            <Link
              to="/projects"
              className="mt-6 inline-flex items-center text-sm font-semibold text-blue-600 sm:hidden"
            >
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* =====================================================
            HOW EVIDENT WORKS
        ===================================================== */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                How EVIDENT Works
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                A simple path from learning to
                <span className="text-blue-600"> real-world experience.</span>
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-slate-500">
                Choose a project, build the work, receive feedback and create
                verifiable proof of what you completed.
              </p>
            </div>

            <div className="relative mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              <div className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-px bg-blue-100 lg:block" />

              {STEPS.map((step, index) => (
                <ProcessStep key={step.title} step={step} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            REAL PLATFORM VALUE — NO FAKE STATS
        ===================================================== */}
        <section className="bg-[#f7faff]">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_EVIDENT.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            PORTFOLIO / EVIDENCE
        ===================================================== */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  BUILD YOUR PORTFOLIO
                </div>

                <h2 className="mt-5 text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl">
                  Build a portfolio
                  <span className="block text-blue-600">
                    you can be proud of.
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                  Students use project work to gain confidence, showcase what
                  they built and have something concrete to discuss during
                  applications and interviews.
                </p>

                <Button
                  asChild
                  className="mt-7 h-11 rounded-xl bg-slate-950 px-5 hover:bg-blue-700"
                >
                  <Link to="/projects">
                    Explore Projects
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <FolderGit2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-950">
                    Show the work
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Connect your project to a GitHub repository and keep the
                    implementation behind your experience visible.
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <FileCheck2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-950">
                    Explain the decisions
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your project gives you a concrete story about what you
                    built, how you built it and what you learned.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950">
                        Turn completed work into verifiable evidence
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Once a project is successfully approved, EVIDENT can
                        provide a certificate and public verification record.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            DIFFERENCE
        ===================================================== */}
        <section className="bg-[#f7faff]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                A Different Approach
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
                Don't just collect learning.
                <span className="block text-blue-600">Build evidence.</span>
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                EVIDENT is designed around doing and demonstrating the work,
                not simply completing another learning module.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
                <div className="p-5 text-sm font-semibold text-slate-500 sm:p-6">
                  Traditional learning
                </div>
                <div className="border-l border-slate-200 bg-blue-50/60 p-5 text-sm font-semibold text-blue-700 sm:p-6">
                  EVIDENT
                </div>
              </div>

              {[
                ["Watch / learn", "Build / apply"],
                ["Complete lessons", "Complete project tasks"],
                ["Quiz or final test", "Submit actual work"],
                ["Course completion", "Evaluation + feedback"],
                ["Certificate", "Evidence + verification"],
                [
                  "Tell recruiters what you know",
                  "Show recruiters what you built",
                ],
              ].map(([left, right], index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 border-b border-slate-100 last:border-b-0"
                >
                  <div className="p-5 text-sm text-slate-500 sm:p-6">{left}</div>
                  <div className="border-l border-slate-100 bg-blue-50/20 p-5 text-sm font-medium text-slate-800 sm:p-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                      {right}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            FAQ
        ===================================================== */}
        <section className="bg-white">
          <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                FAQ
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Questions, answered.
              </h2>

              <p className="mt-4 text-slate-500">
                Everything you need to know before starting a project.
              </p>
            </div>

            <Accordion
              type="single"
              collapsible
              className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 shadow-sm"
            >
              {FAQS.map(([question, answer], index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  data-testid={`home-faq-${index}`}
                >
                  <AccordionTrigger className="py-6 text-left text-base font-semibold text-slate-900 hover:no-underline">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-sm leading-7 text-slate-600">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* =====================================================
            FINAL CTA — LIGHT LIKE REFERENCE
        ===================================================== */}
        <section className="relative overflow-hidden bg-[#edf5ff]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
            <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-purple-200/50 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700">
                  READY TO GET STARTED?
                </div>

                <h2 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Start Your Project Experience Today
                </h2>

                <p className="mt-3 max-w-2xl text-lg leading-7 text-slate-600">
                  Choose a project, build the work, get it reviewed and create
                  evidence for your future.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-xl bg-slate-950 px-6 font-semibold hover:bg-blue-700"
                  >
                    <Link to="/projects">
                      Browse Projects
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl border-blue-200 bg-white px-6 font-semibold text-slate-800"
                  >
                    <Link to="/how-it-works">How It Works</Link>
                  </Button>
                </div>
              </div>

              {/* Same visual language as reference, using the same woman */}
              <div className="relative hidden h-56 overflow-hidden lg:block">
                <div className="absolute bottom-[-80px] right-12 h-64 w-64 rounded-full bg-blue-100/80" />

                <div className="absolute bottom-[-12px] right-16 h-64 w-52 overflow-hidden rounded-[5rem_5rem_0_0]">
                  <img
                    src="https://images.unsplash.com/photo-1513258496099-48168024aec0?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"
                    alt="Student building project experience"
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                <div className="absolute right-8 top-7 rounded-2xl border border-white bg-white/95 p-3 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>

                <div className="absolute right-44 top-20 rounded-2xl border border-white bg-white/95 p-3 shadow-lg">
                  <FolderGit2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </PublicLayout>
  );
}
