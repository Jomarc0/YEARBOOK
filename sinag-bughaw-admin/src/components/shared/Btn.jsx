import { T } from "../../tokens/design";

const variants = {
  primary:   { background: "#4254c5", color: "#fff",     border: "1px solid #4254c5", boxShadow: "0 8px 16px rgba(66,84,197,.2)" },
  secondary: { background: "#fff",     color: "#4f5e7b", border: `1px solid ${T.border}` },
  danger:    { background: "#fff5f5",  color: "#b91c1c", border: "1px solid #fecaca" },
  success:   { background: "#f0fdf4",  color: "#15803d", border: "1px solid #b7efcd" },
};

export default function Btn({ children, variant = "primary", icon, onClick, disabled, type = "button", full = false }) {
  const s = variants[variant] || variants.secondary;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 44,
        borderRadius: 12,
        padding: "0 18px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: "0.93rem",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: full ? "100%" : "auto",
        justifyContent: full ? "center" : "flex-start",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        fontFamily: "Inter, sans-serif",
        ...s,
      }}
    >
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      {children}
    </button>
  );
}
