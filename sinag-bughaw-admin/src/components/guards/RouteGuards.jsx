// src/components/guards/RouteGuards.jsx
import { Navigate } from "react-router-dom";
import { useAuth }  from "../../context/AuthContext";

/** Unauthenticated → /login */
export function ProtectedRoute({ children }) {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

/** Authenticated → /dashboard */
export function GuestRoute({ children }) {
  const { authed } = useAuth();
  if (authed) return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * Super-admin-only route.
 * • Not logged in  → /login
 * • Logged in, not super admin  → inline 403 page
 */
export function SuperAdminRoute({ children }) {
  const { authed, isSuperAdmin } = useAuth();
  if (!authed)       return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <ForbiddenPage />;
  return children;
}

function ForbiddenPage() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "60vh", textAlign: "center", padding: "0 24px",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "rgba(255,100,100,.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, marginBottom: 16,
      }}>🔒</div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e2a4a", marginBottom: 8 }}>
        Access Denied
      </h2>
      <p style={{ fontSize: "0.88rem", color: "#6378a5", maxWidth: 300 }}>
        This section is restricted to Super Administrators only.
      </p>
    </div>
  );
}