import { T } from "../../tokens/design";

export function TH({ children, style = {} }) {
  return (
    <th style={{
      textAlign: "left", padding: "13px 22px",
      color: "#6d7b96", fontSize: "0.83rem",
      letterSpacing: "0.05em", textTransform: "uppercase",
      borderBottom: "1px solid #dfe7f2",
      background: "#fbfcff", fontWeight: 700,
      whiteSpace: "nowrap", ...style,
    }}>
      {children}
    </th>
  );
}

export function TD({ children, style = {} }) {
  return (
    <td style={{
      padding: "15px 22px",
      borderBottom: "1px solid #eef2f8",
      verticalAlign: "middle",
      fontSize: "0.93rem",
      color: T.text, ...style,
    }}>
      {children}
    </td>
  );
}

export function Pager({ from, to, total, hasPrev, hasNext, onPrev, onNext }) {
  return (
    <div style={{
      padding: "13px 18px", display: "flex",
      justifyContent: "space-between", alignItems: "center",
      borderTop: "1px solid #e5ebf5",
      color: "#6f7f9c", fontSize: "0.88rem",
    }}>
      <span>
        {total > 0
          ? `Showing ${from} to ${to} of ${total} entries`
          : "Showing 0 entries"}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        {["Prev", "Next"].map((label, i) => {
          const active = i === 0 ? hasPrev : hasNext;
          return (
            <button
              key={label}
              onClick={i === 0 ? onPrev : onNext}
              disabled={!active}
              style={{
                minWidth: 58, height: 34, borderRadius: 8,
                border: "1px solid #d8e0ee", background: "#fff",
                color: "#71809d", cursor: active ? "pointer" : "not-allowed",
                opacity: active ? 1 : 0.5, fontSize: "0.88rem",
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TableWrapper({ children }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 18, boxShadow: T.shadow, overflow: "hidden",
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
          {children}
        </table>
      </div>
    </div>
  );
}
