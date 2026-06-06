import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../shared/Icon";

export function ProtectedRoute({ children }) {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { authed } = useAuth();
  if (authed) return <Navigate to="/dashboard" replace />;
  return children;
}

export function SuperAdminRoute({ children }) {
  const { authed, isSuperAdmin } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <ForbiddenPage />;
  return children;
}

function ForbiddenPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <Icon name="lock" className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Access Denied</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          This section is restricted to Super Administrators only.
        </p>
      </div>
    </div>
  );
}
