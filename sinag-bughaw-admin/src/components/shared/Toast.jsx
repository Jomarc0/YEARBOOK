import Icon from "./Icon";

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

const icons = {
  success: "check",
  error: "warning",
  warning: "warning",
  info: "bell",
};

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[300] flex w-[320px] max-w-[calc(100vw-32px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl shadow-slate-950/10 ${styles[toast.type] ?? styles.info}`}
        >
          <Icon name={icons[toast.type] ?? "bell"} className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="rounded-lg p-1 transition hover:bg-white/60"
            aria-label="Dismiss notification"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
