import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { id: "dashboard",       label: "Dashboard"          },
      { id: "analytics",       label: "Analytics"          },
    ],
  },
  {
    label: "Users",
    items: [
      { id: "faculty",         label: "Faculty"            },
      { id: "users",           label: "User Management"    },
      { id: "subscriptions",   label: "Subscriptions"      },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "media-library",   label: "Media & Moderation" },
    ],
  },
  {
    label: "Yearbook",
    items: [
      { id: "graduation",      label: "Graduation"         },
      { id: "batches",         label: "Batches"            },
    ],
  },
  {
    label: "System",
    items: [
      { id: "trash",           label: "Trash"              },
      { id: "settings",        label: "Settings"           },
    ],
  },
];

// Only rendered when the logged-in admin is a super_admin
const SUPER_ADMIN_GROUP = {
  label: "Super Admin",
  items: [
    { id: "reports",          label: "Reports"        },
    { id: "admin-management", label: "Admin Accounts" },
  ],
};

export default function Sidebar({ onLogout }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { isSuperAdmin } = useAuth();

  const currentPath = location.pathname.replace("/", "");
  const getIsActive = (id) => {
    if (id === "media-library") {
      return currentPath === "media-library" || currentPath === "content-moderation";
    }
    return currentPath === id;
  };

  const groups = isSuperAdmin
    ? [...NAV_GROUPS, SUPER_ADMIN_GROUP]
    : NAV_GROUPS;

  return (
    <aside style={{
      background: "linear-gradient(180deg, #0c1e4a 0%, #0a1a43 100%)",
      color: "#dbe5ff",
      padding: "22px 12px 16px",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: 236,
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      overflowY: "auto",
      overflowX: "hidden",
      borderRight: "1px solid rgba(147, 174, 255, .12)",
      zIndex: 30,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px 20px", color: "#fff",
        fontWeight: 700, fontSize: "1rem",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "linear-gradient(135deg,#3d62ff,#3553cc)",
          border: "1px solid rgba(173,191,255,.34)",
          display: "grid", placeItems: "center",
          fontSize: 15, flexShrink: 0,
        }}>
          🎓
        </div>
        <span style={{ fontSize: "1.03rem", fontWeight: 800, letterSpacing: "-.01em" }}>NU Admin Portal</span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
        {groups.map(group => {
          const isSuperGroup = group.label === "Super Admin";
          return (
            <div key={group.label}>
              <div style={{
                fontSize: "0.64rem", fontWeight: 800, letterSpacing: ".15em",
                color: isSuperGroup ? "#a78bfa" : "#6f87ba",
                textTransform: "uppercase",
                padding: "0 10px", marginBottom: 7,
                whiteSpace: "nowrap",
              }}>
                {isSuperGroup ? "★  Super Admin" : group.label}
              </div>
              <div style={{ display: "grid", gap: 3 }}>
                {group.items.map(n => {
                  const isActive = getIsActive(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => navigate(`/${n.id}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: isActive ? 700 : 600,
                        fontSize: "0.88rem",
                        textAlign: "left",
                        transition: "all 0.16s ease",
                        background: isActive
                          ? (isSuperGroup ? "#6d3fcf" : "#4458ca")
                          : "transparent",
                        color: isActive ? "#ffffff" : "#d2def8",
                        boxShadow: isActive
                          ? (isSuperGroup
                              ? "0 10px 22px rgba(109,63,207,.36)"
                              : "0 10px 22px rgba(56,76,182,.36)")
                          : "none",
                        fontFamily: "inherit",
                        width: "100%",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div style={{
        paddingTop: 16,
        borderTop: "1px solid rgba(219,229,255,.08)",
        marginTop: 10,
      }}>
        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            color: "#ff8e97", background: "transparent",
            border: 0, padding: "8px 6px",
            fontSize: "0.84rem", cursor: "pointer",
            fontWeight: 600, fontFamily: "inherit",
            width: "100%", whiteSpace: "nowrap",
          }}
        >
          ← Sign Out
        </button>
        <div style={{
          marginTop: 10, paddingLeft: 6,
          color: "#6378a5", fontSize: "0.68rem",
          whiteSpace: "nowrap",
        }}>
        </div>
      </div>
    </aside>
  );
}