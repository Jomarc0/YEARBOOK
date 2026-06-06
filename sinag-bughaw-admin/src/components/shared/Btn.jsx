import Icon from "./Icon";

const variants = {
  primary: "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700",
  secondary: "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

export default function Btn({
  children,
  variant = "primary",
  icon,
  onClick,
  disabled,
  type = "button",
  full = false,
  className = "",
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold transition",
        "focus:outline-none focus:ring-4 focus:ring-indigo-500/15",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        full ? "w-full" : "w-auto",
        variants[variant] ?? variants.secondary,
        className,
      ].join(" ")}
    >
      {icon && (typeof icon === "string" ? <Icon name={icon} className="h-4 w-4" /> : icon)}
      {children}
    </button>
  );
}
