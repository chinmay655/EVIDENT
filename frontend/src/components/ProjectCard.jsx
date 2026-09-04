import { Link } from "react-router-dom";
import {
  Clock,
  Layers,
  ArrowRight,
  Star,
} from "lucide-react";

export function ProjectCard({ project, testId }) {
  const fmtPrice = (price, currency) =>
    `${currency === "INR" ? "₹" : ""}${price}`;

  return (
    <Link
      to={`/projects/${project.slug}`}
      data-testid={testId || `project-card-${project.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-medium text-slate-400">
              Project
            </span>
          </div>
        )}

        {project.featured && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </div>
        )}

        <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          {project.category}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            {project.difficulty}
          </span>

          {project.estimated_hours && (
            <span className="text-xs text-slate-400">
              {project.estimated_hours} hours
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-slate-950 transition-colors group-hover:text-blue-700">
          {project.title}
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
          {project.short_description}
        </p>

        {/* Technologies */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(project.technologies || [])
            .slice(0, 4)
            .map((technology) => (
              <span
                key={technology}
                className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
              >
                {technology}
              </span>
            ))}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {project.duration_days} days
            </span>

            {project.estimated_hours && (
              <span className="hidden items-center gap-1.5 sm:flex">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                {project.estimated_hours}h
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-slate-950">
              {fmtPrice(project.price, project.currency)}
            </span>

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-all group-hover:bg-blue-700 group-hover:shadow-md">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}