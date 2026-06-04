import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import { PageHdr, Flash, Card, CardHead, EmptyState } from "../components/shared/Card";
import { Pager } from "../components/shared/Table";
import { Field, Input, Textarea } from "../components/shared/FormFields";
import Btn from "../components/shared/Btn";

// Light-mode-forced input wrappers so the form is always readable
const FField = ({ label, children }) => (
  <div className="mb-3">
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </label>
    {children}
  </div>
);
const FInput = (props) => (
  <input
    {...props}
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
  />
);
const FTextarea = ({ rows = 3, ...props }) => (
  <textarea
    rows={rows}
    {...props}
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
  />
);
import ConfirmModal from "../components/shared/ConfirmModal";

// FacultyPage
// API:  GET    /api/admin/faculty?search=&page=&per_page=
//       POST   /api/admin/faculty          (multipart/form-data)
//       POST   /api/admin/faculty/{id}     (_method=PUT, multipart/form-data)
//       DELETE /api/admin/faculty/{id}

const PER_PAGE = 4;

export default function FacultyPage({ showToast }) {
  const [list,        setList]        = useState([]);
  const [meta,        setMeta]        = useState(null);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [flash,       setFlash]       = useState({ msg: "", type: "success" });
  const [confirm,     setConfirm]     = useState(null);   // { id, name }
  const [editing,     setEditing]     = useState(null);   // id of expanded record
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPreview,  setAddPreview]  = useState(null);

  const timer      = useRef(null);
  const formRef    = useRef(null);
  const addFileRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (p, q) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/faculty", {
        params: { page: p, search: q, per_page: PER_PAGE },
      });
      setList(res.data.data ?? []);
      // Laravel paginate() can return meta nested OR flat — handle both
      const m = res.data.meta ?? res.data;
      setMeta(m);
    } catch (err) {
      showFlash(err.response?.data?.message ?? "Failed to load faculty.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search);
  }, [page, search]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPage(1), 400);
  };

  // ── Flash ──────────────────────────────────────────────────────────────────
  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash({ msg: "", type: "success" }), 3000);
  };

  // ── Add — POST /api/admin/faculty ──────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);

    const raw = new FormData(e.target);
    const fd  = new FormData();
    fd.append("name",       raw.get("name"));
    fd.append("title",      raw.get("title"));
    fd.append("department", raw.get("department"));
    fd.append("bio",        raw.get("bio") ?? "");

    const file = addFileRef.current?.files[0];
    if (file) fd.append("image", file);

    try {
      await api.post("/admin/faculty", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showFlash("Faculty member added successfully!");
      formRef.current?.reset();
      if (addFileRef.current) addFileRef.current.value = "";
      setAddPreview(null);
      setShowAddForm(false);
      setPage(1);
      load(1, search);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const first  = errors ? Object.values(errors).flat()[0] : null;
      showFlash(first ?? err.response?.data?.message ?? "Failed to add faculty.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Update — POST /api/admin/faculty/{id}  (_method=PUT) ──────────────────
  const handleUpdate = async (id, fd) => {
    setSaving(true);
    fd.append("_method", "PUT");
    try {
      await api.post(`/admin/faculty/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showFlash("Faculty member updated successfully!");
      setEditing(null);
      load(page, search);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const first  = errors ? Object.values(errors).flat()[0] : null;
      showFlash(first ?? err.response?.data?.message ?? "Failed to update faculty.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete — DELETE /api/admin/faculty/{id} ────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/admin/faculty/${confirm.id}`);
      showToast?.(`${confirm.name} deleted`, "error");
      setConfirm(null);
      const newPage = list.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      load(newPage, search);
    } catch (err) {
      showFlash(err.response?.data?.message ?? "Failed to delete faculty.", "error");
      setConfirm(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-7">
      <PageHdr
        title="Faculty"
        sub="Create, update, and remove faculty records from the archive."
      />

      <Flash
        msg={flash.msg}
        type={flash.type}
        onClose={() => setFlash({ msg: "", type: "success" })}
      />

      <div className="grid items-start gap-5">
        <Card>
          {/* ── Top bar ── */}
          <div className="border-b border-slate-200 p-4">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm((p) => !p)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
              >
                {showAddForm ? "Hide Add Faculty Form" : "Add Faculty Member"}
              </button>
            </div>

            {/* ── Add form ── */}
            {showAddForm && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3">
                  <CardHead
                    title="Add Faculty Member"
                    sub="New entries will appear on both the public and admin portals."
                  />
                </div>

                <form ref={formRef} onSubmit={handleAdd}>
                  <FField label="Name">
                    <FInput name="name" placeholder="Dr. Juan Santos" required />
                  </FField>
                  <FField label="Title">
                    <FInput name="title" placeholder="Associate Professor" required />
                  </FField>
                  <FField label="Department">
                    <FInput name="department" placeholder="CITE" required />
                  </FField>
                  <FField label="Short Bio">
                    <FTextarea name="bio" placeholder="Brief background…" rows={3} />
                  </FField>
                  <FField label="Photo">
                    <div className="flex items-center gap-4">
                      {addPreview && (
                        <div className="relative h-20 w-20 shrink-0">
                          <img
                            src={addPreview}
                            alt="Preview"
                            className="h-20 w-20 rounded-xl object-cover border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => { setAddPreview(null); if (addFileRef.current) addFileRef.current.value = ""; }}
                            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs shadow"
                          >✕</button>
                        </div>
                      )}
                      <input
                        ref={addFileRef}
                        type="file"
                        accept="image/*"
                        className="text-sm text-slate-600"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setAddPreview(URL.createObjectURL(file));
                          else setAddPreview(null);
                        }}
                      />
                    </div>
                  </FField>
                  <Btn type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving…" : "Save Faculty"}
                  </Btn>
                </form>
              </div>
            )}

            {/* ── Search bar ── */}
            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5">
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search faculty by name, title, or department"
                className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="text-slate-400 transition hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </label>
          </div>

          {/* ── Faculty list ── */}
          <div className="grid gap-3.5 p-4">
            {loading ? (
              Array.from({ length: PER_PAGE }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse gap-3.5 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-indigo-50" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-1/2 rounded bg-slate-200" />
                    <div className="h-3 w-1/3 rounded bg-slate-200" />
                    <div className="h-3 w-1/4 rounded bg-slate-200" />
                  </div>
                </div>
              ))
            ) : list.length === 0 ? (
              <EmptyState msg="No faculty records found." />
            ) : (
              list.map((fac) => (
                <FacultyCard
                  key={fac.id}
                  fac={fac}
                  isEditing={editing === fac.id}
                  saving={saving}
                  onToggleEdit={() =>
                    setEditing(editing === fac.id ? null : fac.id)
                  }
                  onUpdate={(fd) => handleUpdate(fac.id, fd)}
                  onDelete={() => setConfirm({ id: fac.id, name: fac.name })}
                />
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          <Pager
            from={meta?.from ?? 0}
            to={meta?.to ?? 0}
            total={meta?.total ?? 0}
            hasPrev={page > 1}
            hasNext={meta ? page < meta.last_page : false}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </Card>
      </div>

      {/* ── Confirm delete modal ── */}
      <ConfirmModal
        open={!!confirm}
        title="Delete Faculty Record"
        message={`Are you sure you want to delete "${confirm?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ─── FacultyCard ──────────────────────────────────────────────────────────────
function FacultyCard({ fac, isEditing, saving, onToggleEdit, onUpdate, onDelete }) {
  const [f, setF] = useState({
    name:       fac.name,
    title:      fac.title,
    department: fac.department,
    bio:        fac.bio ?? "",
  });
  const [editPreview, setEditPreview] = useState(null);
  const fileRef = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // Sync local state when parent record changes (e.g. after save)
  useEffect(() => {
    setF({
      name:       fac.name,
      title:      fac.title,
      department: fac.department,
      bio:        fac.bio ?? "",
    });
  }, [fac]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name",       f.name);
    fd.append("title",      f.title);
    fd.append("department", f.department);
    fd.append("bio",        f.bio);
    if (fileRef.current?.files[0]) {
      fd.append("image", fileRef.current.files[0]);
    }
    onUpdate(fd);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300">
      {/* ── Header row ── */}
      <div className="mb-3 flex items-start gap-3.5">
        {/* Avatar */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-indigo-50">
          <img
            src={fac.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fac.name)}&size=64&background=e0e7ff&color=4338ca&bold=true`}
            alt={fac.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fac.name)}&size=64&background=e0e7ff&color=4338ca&bold=true`;
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="mb-0.5 truncate text-base font-extrabold text-slate-800">
            {fac.name}
          </p>
          <p className="mb-0.5 text-sm text-slate-500">{fac.title}</p>
          <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
            {fac.department}
          </span>
        </div>

        {/* Edit toggle */}
        <button
          onClick={onToggleEdit}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Bio (view mode) */}
      {fac.bio && !isEditing && (
        <p className="text-sm leading-relaxed text-slate-500">{fac.bio}</p>
      )}

      {/* ── Edit form ── */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="mt-3 border-t border-slate-100 pt-3.5 space-y-0">
          <FField label="Name">
            <FInput value={f.name} onChange={(e) => set("name", e.target.value)} required />
          </FField>
          <FField label="Title">
            <FInput value={f.title} onChange={(e) => set("title", e.target.value)} required />
          </FField>
          <FField label="Department">
            <FInput value={f.department} onChange={(e) => set("department", e.target.value)} required />
          </FField>
          <FField label="Short Bio">
            <FTextarea value={f.bio} onChange={(e) => set("bio", e.target.value)} rows={2} />
          </FField>
          <FField label="Replace Photo">
            <div className="flex items-center gap-4">
              {(editPreview || fac.photo) && (
                <div className="relative h-20 w-20 shrink-0">
                  <img
                    src={editPreview || fac.photo}
                    alt="Preview"
                    className="h-20 w-20 rounded-xl object-cover border border-slate-200"
                  />
                  {editPreview && (
                    <button
                      type="button"
                      onClick={() => { setEditPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs shadow"
                    >✕</button>
                  )}
                </div>
              )}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="text-sm text-slate-600"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setEditPreview(URL.createObjectURL(file));
                    else setEditPreview(null);
                  }}
                />
                <p className="mt-1 text-xs text-slate-400">
                  {editPreview ? "New photo selected — click Update to save." : fac.photo ? "Pick a new file to replace the current photo." : "No photo yet."}
                </p>
              </div>
            </div>
          </FField>

          <div className="flex gap-2 pt-1">
            <Btn type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Update"}
            </Btn>
            <Btn type="button" variant="danger" onClick={onDelete}>
              Delete
            </Btn>
          </div>
        </form>
      )}
    </div>
  );
}