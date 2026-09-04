import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { PublicLayout } from "@/components/PublicNav";
import { ProjectCard } from "@/components/ProjectCard";
import { Loading, EmptyState } from "@/components/common";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowRight,
  PlayCircle,
  BriefcaseBusiness,
  MessageSquare,
  BadgeCheck,
  SlidersHorizontal,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Web Development",
  "Data Analytics",
  "Python",
  "AI/ML",
  "UI/UX",
  "Cybersecurity",
  "Cloud/DevOps",
  "Business/Marketing",
];

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

const SORTS = [
  ["newest", "Newest"],
  ["price_low", "Price: Low to High"],
  ["price_high", "Price: High to Low"],
  ["popular", "Most Popular"],
];

export default function Projects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    difficulty: "All",
    sort: "newest",
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        sort: filters.sort,
        limit: 24,
      };

      if (filters.search) params.search = filters.search;
      if (filters.category !== "All") {
        params.category = filters.category;
      }
      if (filters.difficulty !== "All") {
        params.difficulty = filters.difficulty;
      }

      const { data } = await api.get("/projects", { params });

      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const set = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "All",
      difficulty: "All",
      sort: "newest",
    });
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#f8faff]">

        {/* HERO */}
        <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-[#f5f7ff] to-[#eef2ff] shadow-sm">

              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
              <div className="absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-indigo-100/50 blur-3xl" />

              <div className="relative grid min-h-[360px] items-center gap-8 px-7 py-10 md:px-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">

                {/* Hero content */}
                <div className="max-w-2xl">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    <span>Learn</span>
                    <span className="text-slate-300">•</span>
                    <span>Build</span>
                    <span className="text-slate-300">•</span>
                    <span>Showcase</span>
                  </div>

                  <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[54px]">
                    Real Projects.
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Real Experience.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                    Go beyond just certificates. Apply what you know,
                    work on industry-style projects, and build
                    <span className="font-semibold text-slate-900">
                      {" "}verified project experience
                    </span>{" "}
                    for your resume.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        document
                          .getElementById("explore-projects")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Explore Projects
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() =>
                        window.location.href = "/how-it-works"
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                      How It Works
                    </button>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                      Industry-style projects
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      Real feedback
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BadgeCheck className="h-4 w-4 text-blue-600" />
                      Verified certificates
                    </div>
                  </div>
                </div>

                {/* Hero visual */}
                <div className="relative hidden min-h-[280px] items-center justify-center lg:flex">

                  <div className="absolute h-64 w-64 rounded-full bg-blue-100/80" />

                  <div className="relative z-10 w-[280px] rounded-3xl border border-white bg-white/90 p-5 shadow-xl backdrop-blur">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5">
                      <div className="mb-5 flex items-center justify-between">
                        <div className="h-3 w-20 rounded-full bg-white/30" />
                        <div className="h-7 w-7 rounded-lg bg-white/10" />
                      </div>

                      <div className="space-y-3">
                        <div className="h-3 w-full rounded-full bg-white/20" />
                        <div className="h-3 w-4/5 rounded-full bg-white/20" />
                        <div className="h-3 w-3/5 rounded-full bg-white/20" />
                      </div>

                      <div className="mt-7 grid grid-cols-3 gap-2">
                        <div className="h-14 rounded-xl bg-blue-500/30" />
                        <div className="h-14 rounded-xl bg-indigo-500/30" />
                        <div className="h-14 rounded-xl bg-emerald-500/20" />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">
                          Project Experience
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          Verified & Reviewed
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-4 top-8 z-20 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                        <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Build
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          Practical Skills
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-7 right-2 z-20 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                        <BadgeCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Add to your
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          Resume
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROJECTS */}
        <section
          id="explore-projects"
          className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
        >
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                YOUR NEXT PROJECT
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Explore Projects
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                Choose an industry-relevant project, apply your knowledge,
                and create evidence you can actually talk about.
              </p>
            </div>

            <div className="text-sm font-medium text-slate-500">
              {loading
                ? "Finding projects..."
                : `${items.length} project${items.length === 1 ? "" : "s"} available`}
            </div>
          </div>

          {/* Search + filters */}
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">

              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={filters.search}
                  onChange={(e) => set("search", e.target.value)}
                  placeholder="Search projects, skills or technologies..."
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 shadow-none focus:bg-white"
                  data-testid="project-search"
                />
              </div>

              <div className="flex gap-2">
                <Select
                  value={filters.category}
                  onValueChange={(v) => set("category", v)}
                >
                  <SelectTrigger
                    className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 md:w-52"
                    data-testid="filter-category"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.difficulty}
                  onValueChange={(v) => set("difficulty", v)}
                >
                  <SelectTrigger
                    className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 md:w-40"
                    data-testid="filter-difficulty"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {DIFFICULTIES.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sort}
                  onValueChange={(v) => set("sort", v)}
                >
                  <SelectTrigger
                    className="hidden h-11 rounded-xl border-slate-200 bg-slate-50 md:flex md:w-48"
                    data-testid="filter-sort"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {SORTS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  onClick={resetFilters}
                  title="Reset filters"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Category pills */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((category) => {
                const active = filters.category === category;

                return (
                  <button
                    key={category}
                    onClick={() => set("category", category)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project grid */}
          <div className="mt-7">
            {loading ? (
              <Loading />
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <EmptyState
                  title="No projects found"
                  description="Try adjusting your search or filters."
                  testId="projects-empty"
                />
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {items.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}