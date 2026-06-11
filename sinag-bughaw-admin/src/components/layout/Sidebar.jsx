import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../shared/Icon";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard" },
      { id: "analytics", label: "Analytics", icon: "analytics" },
    ],
  },
  {
    label: "Users",
    items: [
      { id: "faculty", label: "Faculty", icon: "user" },
      { id: "users", label: "User Management", icon: "users" },
      { id: "subscriptions", label: "Subscriptions", icon: "crown" },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "media-library", label: "Media", icon: "gallery" },
      { id: "announcements", label: "Announcements", icon: "bell" },
    ],
  },
  {
    label: "Yearbook",
    items: [
      { id: "graduation", label: "Graduation", icon: "graduation" },
      { id: "batches", label: "Batches", icon: "book" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "trash", label: "Trash", icon: "trash" },
      { id: "settings", label: "Settings", icon: "settings" },
    ],
  },
];

const SUPER_ADMIN_GROUP = {
  label: "Super Admin",
  items: [
    { id: "reports", label: "Reports", icon: "reports" },
    { id: "admin-management", label: "Admin Accounts", icon: "shield" },
  ],
};

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useAuth();

  const currentPath = location.pathname.replace("/", "");
  const groups = isSuperAdmin ? [...NAV_GROUPS, SUPER_ADMIN_GROUP] : NAV_GROUPS;

  const getIsActive = (id) => id === "media-library"
    ? currentPath === "media-library" || currentPath === "content-moderation"
    : currentPath === id;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#081b49] px-3 py-4 text-slate-100">
      <div className="mb-4 flex items-center gap-3 border-b border-white/10 px-2 pb-4">
        <img src="/images/NU_logo.png" alt="NU Logo" className="h-9 w-9 shrink-0 object-contain" />
        <div className="min-w-0">
          <p className="truncate text-base font-black leading-tight text-white">NU Admin</p>
          <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-blue-200/50">Portal</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-3">
        {groups.map((group) => {
          const isSuperGroup = group.label === "Super Admin";
          return (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-xs font-black tracking-wide text-slate-500">
                {group.label}
              </p>
              <div className="grid gap-1">
                {group.items.map((item) => {
                  const active = getIsActive(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/${item.id}`)}
                      className={[
                        "group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-extrabold transition",
                        active
                          ? isSuperGroup
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                            : "bg-indigo-600 text-white shadow-lg shadow-blue-950/30"
                          : "text-blue-50/85 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      <Icon name={item.icon} className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-blue-200/60 group-hover:text-white"}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-4 flex h-11 items-center gap-3 border-t border-white/10 px-2 pt-4 text-left text-sm font-extrabold text-slate-400 transition hover:text-slate-200"
      >
        <Icon name="logout" className="h-4 w-4" />
        Sign Out
      </button>
    </aside>
  );
}
