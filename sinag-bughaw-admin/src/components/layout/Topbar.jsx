import { useAuth } from "../../context/AuthContext";
import Icon from "../shared/Icon";

export default function Topbar() {
  const { admin, isSuperAdmin } = useAuth();

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayName = admin?.name ?? "Admin";
  const displayRole = isSuperAdmin ? "Super Admin" : "Admin";
  const photoUrl = admin?.profile_photo ?? admin?.profile_picture ?? admin?.avatar ?? admin?.photo ?? null;
  const initials = displayName.trim().slice(0, 1).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md">
      <div className="inline-flex items-center gap-2 text-sm font-extrabold tracking-normal text-slate-500">
        <Icon name="calendar" className="h-4 w-4 text-indigo-500" />
        {today}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="admin-icon-button relative" aria-label="Notifications">
          <Icon name="bell" className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-black leading-5 text-slate-900">{displayName}</div>
            <div className={`text-xs font-black uppercase tracking-wider ${isSuperAdmin ? "text-violet-600" : "text-slate-400"}`}>
              {displayRole}
            </div>
          </div>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              className="h-10 w-10 rounded-xl border border-indigo-200 object-cover"
            />
          ) : (
            <div className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black ${isSuperAdmin ? "border-violet-200 bg-violet-100 text-violet-700" : "border-indigo-200 bg-indigo-100 text-indigo-700"}`}>
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
