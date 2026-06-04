import { useAuth } from "../../context/AuthContext";

export default function Topbar() {
  const { admin, isSuperAdmin } = useAuth(); // ← read from AuthContext directly

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const displayName = admin?.name ?? "Admin";
  const displayRole = isSuperAdmin ? "Super Admin" : "Admin";

  return (
    <div style={{
      background: "rgba(255,255,255,.92)",
      borderBottom: "1px solid #dde6f5",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      position: "sticky",
      top: 0,
      zIndex: 20,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#5f6f8f", letterSpacing: ".02em" }}>
        {today}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button style={{
          width: 38, height: 38, borderRadius: 12,
          border: "1px solid #d5deef", background: "#fff",
          cursor: "pointer", fontSize: 14, color: "#3f4f73",
          position: "relative", display: "grid", placeItems: "center",
          boxShadow: "0 4px 12px rgba(15,23,42,.08)",
        }}>
          🔔
          <span style={{
            position: "absolute", top: 8, right: 8,
            width: 7, height: 7, borderRadius: "50%",
            background: "#ff3647", border: "2px solid #fff",
          }} />
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          paddingLeft: 14, borderLeft: "1px solid #dbe4f3",
        }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#18253f" }}>
              {displayName}
            </div>
            <div style={{
              fontSize: "0.7rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.09em",
              color: isSuperAdmin ? "#7c3aed" : "#7d8ca8", // purple for super admin
            }}>
              {isSuperAdmin ? "★ " : ""}{displayRole}
            </div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: isSuperAdmin
              ? "linear-gradient(145deg, #ede9fe, #ddd6fe)"  // purple for super admin
              : "linear-gradient(145deg, #edf2ff, #e4ebff)", // blue for admin
            color: isSuperAdmin ? "#6d28d9" : "#2f47c5",
            border: isSuperAdmin ? "1px solid #c4b5fd" : "1px solid #ccd9fb",
            display: "grid", placeItems: "center", fontSize: 15,
          }}>
            👤
          </div>
        </div>
      </div>
    </div>
  );
}