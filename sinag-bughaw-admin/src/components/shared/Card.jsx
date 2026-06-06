import Icon from "./Icon";

export function Card({ children, className = "", style }) {
  return (
    <div className={`admin-shell-card overflow-hidden ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub, icon }) {
  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon name={icon} className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-black leading-tight text-slate-900">{title}</h2>
          {sub && <p className="mt-1 text-sm leading-6 text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export function PageHdr({ title, sub, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-black leading-tight tracking-normal text-slate-950 md:text-3xl">
          {title}
        </h1>
        {sub && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">{sub}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function Flash({ msg, type = "success", onClose }) {
  if (!msg) return null;

  const palette = type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${palette}`}>
      <span>{msg}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="rounded-lg p-1 transition hover:bg-white/60" aria-label="Dismiss">
          <Icon name="close" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ msg = "No records found.", icon = "archive" }) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-slate-500">{msg}</p>
    </div>
  );
}
