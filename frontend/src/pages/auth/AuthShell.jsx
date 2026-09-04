import { Link } from "react-router-dom";

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-900 text-xs font-bold">E</div>
          <span className="font-display text-xl font-bold text-white">EVIDENT</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">Build real projects.<br />Prove your skills.</h2>
          <p className="mt-4 max-w-md text-slate-400">Complete realistic projects, get your work reviewed, and generate verifiable evidence you can show recruiters.</p>
        </div>
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} EVIDENT</p>
      </div>
      <div className="flex items-center justify-center bg-[#fafafa] px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white text-xs font-bold">E</div>
            <span className="font-display text-xl font-bold text-slate-900">EVIDENT</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
