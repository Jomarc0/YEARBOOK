import Icon from "./Icon";

export function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

const inputClass = "admin-input";

export function Input({ type = "text", name, placeholder, value, defaultValue, onChange, required, min, max, step, autoFocus, className = "" }) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      required={required}
      min={min}
      max={max}
      step={step}
      autoFocus={autoFocus}
      className={`${inputClass} ${className}`}
    />
  );
}

export function Textarea({ name, placeholder, value, defaultValue, onChange, rows = 4, className = "" }) {
  return (
    <textarea
      name={name}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      rows={rows}
      className={`min-h-[96px] resize-y py-3 ${inputClass} ${className}`}
    />
  );
}

export function Select({ name, value, onChange, children, required, className = "" }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`${inputClass} cursor-pointer ${className}`}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <button
        type="button"
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full border transition ${checked ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-slate-300"}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`} />
      </button>
      <span className="text-sm font-bold text-slate-800">{label}</span>
    </label>
  );
}

export function IconInput({ icon, type = "text", name, placeholder, value, onChange, required, autoFocus }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {typeof icon === "string" ? <Icon name={icon} className="h-4 w-4" /> : icon}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoFocus={autoFocus}
        className={`${inputClass} pl-11`}
      />
    </div>
  );
}
