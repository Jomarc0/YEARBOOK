const styles = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-rose-100 text-rose-700",
  info: "bg-indigo-100 text-indigo-700",
  muted: "bg-slate-100 text-slate-600",
};

export default function Badge({ children, variant = "info", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-normal ${styles[variant] ?? styles.info} ${className}`}>
      {children}
    </span>
  );
}
