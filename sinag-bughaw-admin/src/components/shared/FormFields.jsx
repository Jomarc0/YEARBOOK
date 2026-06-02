import { inputCss } from "../../tokens/design";

export function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: "0.81rem", fontWeight: 700,
        color: "#55637f", marginBottom: 8,
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "0.8rem" }}>{hint}</p>}
    </div>
  );
}

export function Input({ type = "text", name, placeholder, value, defaultValue, onChange, required, min, max, step, autoFocus }) {
  return (
    <input
      type={type} name={name} placeholder={placeholder}
      value={value} defaultValue={defaultValue}
      onChange={onChange} required={required}
      min={min} max={max} step={step} autoFocus={autoFocus}
      style={inputCss}
      onFocus={e => e.target.style.borderColor = "#4254c5"}
      onBlur={e => e.target.style.borderColor = "#cfdaec"}
    />
  );
}

export function Textarea({ name, placeholder, value, defaultValue, onChange, rows = 4 }) {
  return (
    <textarea
      name={name} placeholder={placeholder}
      value={value} defaultValue={defaultValue}
      onChange={onChange} rows={rows}
      style={{ ...inputCss, resize: "vertical", minHeight: 90 }}
      onFocus={e => e.target.style.borderColor = "#4254c5"}
      onBlur={e => e.target.style.borderColor = "#cfdaec"}
    />
  );
}

export function Select({ name, value, onChange, children, required }) {
  return (
    <select
      name={name} value={value} onChange={onChange} required={required}
      style={{ ...inputCss, height: 46, cursor: "pointer" }}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", border: "1px solid #cfdaec",
      borderRadius: 12, background: "#f8fbff",
      cursor: "pointer", userSelect: "none",
    }}>
      <div
        onClick={onChange}
        style={{
          width: 44, height: 23, borderRadius: 12,
          background: checked ? "#4254c5" : "#cbd5e1",
          cursor: "pointer", position: "relative",
          transition: "background .2s", flexShrink: 0,
          border: `1px solid ${checked ? "#4254c5" : "#d1d5db"}`,
        }}
      >
        <div style={{
          width: 17, height: 17, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 2,
          left: checked ? 23 : 2,
          transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.15)",
        }} />
      </div>
      <span style={{ fontSize: "0.93rem", color: "#1f2a44", fontWeight: 500 }}>{label}</span>
    </label>
  );
}

export function IconInput({ icon, type = "text", name, placeholder, value, onChange, required, autoFocus }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#95a3be", pointerEvents: "none" }}>
        {icon}
      </span>
      <input
        type={type} name={name} placeholder={placeholder}
        value={value} onChange={onChange}
        required={required} autoFocus={autoFocus}
        style={{ ...inputCss, height: 48, paddingLeft: 46 }}
        onFocus={e => e.target.style.borderColor = "#4254c5"}
        onBlur={e => e.target.style.borderColor = "#cfdaec"}
      />
    </div>
  );
}
