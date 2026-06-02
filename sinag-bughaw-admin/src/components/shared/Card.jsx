import { T } from "../../tokens/design";

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      boxShadow: T.shadow,
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub }) {
  return (
    <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #e5ebf5" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 800, color: T.text }}>{title}</h2>
      {sub && <p style={{ margin: 0, color: "#7790b2", fontSize: "0.9rem" }}>{sub}</p>}
    </div>
  );
}

export function PageHdr({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: T.text, lineHeight: 1.1 }}>
          {title}
        </h1>
        {sub && <p style={{ margin: "6px 0 0", color: T.muted }}>{sub}</p>}
      </div>
      {action && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{action}</div>}
    </div>
  );
}

export function Flash({ msg, type = "success", onClose }) {
  if (!msg) return null;
  const s = type === "success"
    ? { background: "#ecfdf3", border: "1px solid #b7efcd", color: "#15803d" }
    : { background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" };
  return (
    <div style={{ ...s, borderRadius: 14, padding: "13px 16px", fontWeight: 600, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{msg}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16, lineHeight: 1 }}>✕</button>
      )}
    </div>
  );
}

export function EmptyState({ msg = "No records found." }) {
  return (
    <div style={{ padding: "44px 24px", textAlign: "center", color: "#7d8ba6", fontSize: "0.95rem" }}>
      {msg}
    </div>
  );
}
