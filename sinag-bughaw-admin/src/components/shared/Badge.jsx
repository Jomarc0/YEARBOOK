const styles = {
  success:  { color: "#16a34a", background: "#dcfce7" },
  warning:  { color: "#d97706", background: "#fef3c7" },
  critical: { color: "#dc2626", background: "#fee2e2" },
  info:     { color: "#4254c5", background: "#eef1ff" },
  muted:    { color: "#64748b", background: "#f1f5f9" },
};

export default function Badge({ children, variant = "info" }) {
  const s = styles[variant] || styles.info;
  return (
    <span style={{
      ...s,
      display: "inline-flex",
      padding: "4px 11px",
      borderRadius: 999,
      fontSize: "0.78rem",
      fontWeight: 800,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}
