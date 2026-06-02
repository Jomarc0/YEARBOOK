const styles = {
  success: { bg: "#ecfdf3", border: "#b7efcd", color: "#15803d" },
  error:   { bg: "#fff1f2", border: "#fecdd3", color: "#be123c" },
  warning: { bg: "#fefce8", border: "#fde68a", color: "#92400e" },
  info:    { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
};

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      zIndex: 300, display: "flex", flexDirection: "column",
      gap: 8, width: 300, pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const s = styles[t.type] || styles.info;
        return (
          <div key={t.id} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 12, padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 20px rgba(0,0,0,.12)",
            pointerEvents: "all",
            animation: "slideUp .2s ease",
          }}>
            <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 500, color: s.color }}>
              {t.message}
            </span>
            <button
              onClick={() => onDismiss(t.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: s.color, fontSize: 16, lineHeight: 1, padding: 2 }}
            >
              ✕
            </button>
          </div>
        );
      })}
      <style>{`@keyframes slideUp { from { transform:translateY(10px); opacity:0; } to { transform:none; opacity:1; } }`}</style>
    </div>
  );
}
