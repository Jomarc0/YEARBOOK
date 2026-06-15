// src/pages/AdminManagementPage.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const EMPTY_FORM = {
  name: "", username: "", password: "",
  password_confirmation: "", role: "admin",
};

export default function AdminManagementPage({ showToast }) {
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [roleFilter, setRole] = useState("");
  const [modal,   setModal]   = useState(null);  // null | { mode: 'create'|'edit', data? }
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  // Fetch
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)     params.set("search", search);
      if (roleFilter) params.set("role",   roleFilter);
      const { data } = await api.get(`/admin/admins?${params}`);
      setAdmins(data.data);
    } catch {
      showToast("Failed to load admin accounts.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, showToast]);

  useEffect(() => { fetch(); }, [fetch]);

  // Modal helpers
  const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setModal({ mode: "create" }); };
  const openEdit   = (a) => {
    setForm({ name: a.name, username: a.username, password: "", password_confirmation: "", role: a.role });
    setErrors({});
    setModal({ mode: "edit", data: a });
  };
  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: undefined }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (modal.mode === "create") {
        const { data } = await api.post("/admin/admins", form);
        showToast(data.message, "success");
      } else {
        const payload = { ...form };
        if (!payload.password) { delete payload.password; delete payload.password_confirmation; }
        const { data } = await api.put(`/admin/admins/${modal.data.id}`, payload);
        showToast(data.message, "success");
      }
      closeModal();
      fetch();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
      else showToast(err.response?.data?.message ?? "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete "${admin.name}"? This cannot be undone.`)) return;
    try {
      const { data } = await api.delete(`/admin/admins/${admin.id}`);
      showToast(data.message, "success");
      fetch();
    } catch (err) {
      showToast(err.response?.data?.message ?? "Delete failed.", "error");
    }
  };

  // Toggle status
  const handleToggle = async (admin) => {
    try {
      const { data } = await api.patch(`/admin/admins/${admin.id}/toggle-status`);
      showToast(data.message, "success");
      setAdmins(prev => prev.map(a =>
        a.id === admin.id ? { ...a, is_active: data.is_active } : a
      ));
    } catch (err) {
      showToast(err.response?.data?.message ?? "Toggle failed.", "error");
    }
  };


  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1e2a4a", margin: 0 }}>
            Admin Management
          </h1>
          <p style={{ fontSize: "0.84rem", color: "#7a8bad", marginTop: 4 }}>
            Manage admin and super admin accounts
          </p>
        </div>
        <button onClick={openCreate} style={btnStyle("#4458ca")}>
          + New Admin
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or username…"
          style={inputStyle({ flex: 1 })}
        />
        <select
          value={roleFilter} onChange={e => setRole(e.target.value)}
          style={inputStyle({ minWidth: 140 })}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", borderRadius: 16,
        boxShadow: "0 2px 16px rgba(30,42,74,.07)",
        overflow: "hidden",
        border: "1px solid rgba(30,42,74,.07)",
      }}>
        {loading ? (
          <div style={emptyState}>Loading…</div>
        ) : admins.length === 0 ? (
          <div style={emptyState}>No admin accounts found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "#f5f7fc", borderBottom: "1px solid #eef0f7" }}>
                {["Name", "Username", "Role", "Status", "Last Login", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px 18px", textAlign: "left",
                    fontSize: "0.72rem", fontWeight: 700,
                    color: "#7a8bad", textTransform: "uppercase", letterSpacing: ".08em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, i) => (
                <tr key={admin.id} style={{
                  borderBottom: i < admins.length - 1 ? "1px solid #f0f2f8" : "none",
                }}>
                  {/* Name */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: admin.is_super_admin
                          ? "linear-gradient(135deg,#7c3aed,#5b21b6)"
                          : "linear-gradient(135deg,#3d62ff,#3553cc)",
                        display: "grid", placeItems: "center",
                        fontSize: "0.72rem", fontWeight: 800, color: "#fff",
                      }}>
                        {admin.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, color: "#1e2a4a" }}>{admin.name}</span>
                    </div>
                  </td>
                  {/* Username */}
                  <td style={{ padding: "14px 18px", color: "#4a5d82", fontFamily: "monospace", fontSize: "0.82rem" }}>
                    {admin.username}
                  </td>
                  {/* Role badge */}
                  <td style={{ padding: "14px 18px" }}>
                    <span style={roleBadge(admin.is_super_admin)}>
                      {admin.is_super_admin ? "★ Super Admin" : "Admin"}
                    </span>
                  </td>
                  {/* Status badge */}
                  <td style={{ padding: "14px 18px" }}>
                    <span style={statusBadge(admin.is_active)}>
                      {admin.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* Last login */}
                  <td style={{ padding: "14px 18px", color: "#7a8bad", fontSize: "0.82rem" }}>
                    {admin.last_login_at
                      ? new Date(admin.last_login_at).toLocaleDateString()
                      : "—"}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <TinyBtn label="Edit"     color="#3d62ff" onClick={() => openEdit(admin)} />
                      <TinyBtn
                        label={admin.is_active ? "Deactivate" : "Activate"}
                        color={admin.is_active ? "#d97706" : "#059669"}
                        onClick={() => handleToggle(admin)}
                      />
                      <TinyBtn label="Delete"   color="#e53e3e" onClick={() => handleDelete(admin)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(10,20,60,.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 16px",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20,
            padding: "28px 28px 24px",
            width: "100%", maxWidth: 460,
            boxShadow: "0 24px 60px rgba(10,20,60,.22)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e2a4a", margin: 0 }}>
                {modal.mode === "create" ? "Create Admin Account" : "Edit Admin Account"}
              </h2>
              <button onClick={closeModal} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "1.4rem", color: "#7a8bad", lineHeight: 1,
              }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <ModalField label="Full Name" error={errors.name}>
                <input name="name" value={form.name} onChange={handleChange}
                  required placeholder="John Doe" style={modalInput(errors.name)} />
              </ModalField>
              <ModalField label="Username" error={errors.username}>
                <input name="username" value={form.username} onChange={handleChange}
                  required placeholder="johndoe" style={modalInput(errors.username)} />
              </ModalField>
              <ModalField
                label={modal.mode === "edit" ? "New Password (leave blank to keep)" : "Password"}
                error={errors.password}
              >
                <input name="password" type="password" value={form.password}
                  onChange={handleChange} required={modal.mode === "create"}
                  placeholder="••••••••" style={modalInput(errors.password)} />
              </ModalField>
              <ModalField label="Confirm Password" error={errors.password_confirmation}>
                <input name="password_confirmation" type="password" value={form.password_confirmation}
                  onChange={handleChange}
                  required={modal.mode === "create" || !!form.password}
                  placeholder="••••••••" style={modalInput(errors.password_confirmation)} />
              </ModalField>
              <ModalField label="Role" error={errors.role}>
                <select name="role" value={form.role} onChange={handleChange}
                  style={modalInput(errors.role)}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </ModalField>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={closeModal} style={{
                  padding: "9px 18px", background: "none", border: "none",
                  cursor: "pointer", color: "#7a8bad", fontWeight: 600,
                  fontSize: "0.88rem", fontFamily: "inherit",
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={btnStyle("#4458ca", { opacity: saving ? .6 : 1 })}>
                  {saving ? "Saving…" : modal.mode === "create" ? "Create" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function TinyBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 10px", border: `1px solid ${color}20`,
      borderRadius: 7, background: `${color}0d`,
      color, cursor: "pointer", fontWeight: 600,
      fontSize: "0.76rem", fontFamily: "inherit",
      transition: "all .14s",
    }}>
      {label}
    </button>
  );
}

function ModalField({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#4a5d82", marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: "0.76rem", color: "#e53e3e" }}>
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
    </div>
  );
}

// Style helpers

const emptyState = {
  padding: "56px 0", textAlign: "center",
  color: "#a0aec0", fontSize: "0.88rem",
};

const inputStyle = (extra = {}) => ({
  border: "1.5px solid #e2e8f0",
  borderRadius: 10, padding: "9px 13px",
  fontSize: "0.88rem", outline: "none",
  fontFamily: "inherit", color: "#1e2a4a",
  background: "#fff",
  ...extra,
});

const modalInput = (err) => ({
  width: "100%", border: `1.5px solid ${err ? "#fc8181" : "#e2e8f0"}`,
  borderRadius: 10, padding: "9px 13px",
  fontSize: "0.88rem", outline: "none",
  fontFamily: "inherit", color: "#1e2a4a",
  boxSizing: "border-box",
});

const btnStyle = (bg, extra = {}) => ({
  padding: "9px 20px",
  background: bg, color: "#fff",
  border: "none", borderRadius: 10,
  cursor: "pointer", fontWeight: 700,
  fontSize: "0.88rem", fontFamily: "inherit",
  ...extra,
});

const roleBadge = (isSuper) => ({
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: "0.74rem", fontWeight: 700,
  background: isSuper ? "rgba(124,58,237,.1)" : "rgba(61,98,255,.1)",
  color: isSuper ? "#7c3aed" : "#3d62ff",
});

const statusBadge = (active) => ({
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "3px 10px", borderRadius: 20,
  fontSize: "0.74rem", fontWeight: 700,
  background: active ? "rgba(5,150,105,.1)" : "rgba(160,174,192,.15)",
  color: active ? "#059669" : "#718096",
});