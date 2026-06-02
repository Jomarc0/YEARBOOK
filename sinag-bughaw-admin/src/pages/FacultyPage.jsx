import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import { PageHdr, Flash, Card, CardHead, EmptyState } from "../components/shared/Card";
import { Pager } from "../components/shared/Table";
import { Field, Input, Textarea } from "../components/shared/FormFields";
import Btn from "../components/shared/Btn";
import ConfirmModal from "../components/shared/ConfirmModal";

// FacultyPage
// API:  GET    /api/admin/faculty?search=&page=
//       POST   /api/admin/faculty
//       PUT    /api/admin/faculty/{id}
//       DELETE /api/admin/faculty/{id}

const PER_PAGE = 4;

export default function FacultyPage({ showToast }) {
  const [list,    setList]    = useState([]);
  const [meta,    setMeta]    = useState(null);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [flash,   setFlash]   = useState({ msg: "", type: "success" });
  const [confirm, setConfirm] = useState(null);  // { id, name }
  const [editing, setEditing] = useState(null);  // id of expanded record
  const [showAddForm, setShowAddForm] = useState(false);
  const timer = useRef(null);
  const formRef = useRef(null);

  // ── Fetch list ──────────────────────────────────────────────────────────────
  // load takes explicit args so it never closes over stale state
  const load = useCallback(async (p, q) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/faculty", { params: { page: p, search: q, per_page: PER_PAGE } });
      setList(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
    } catch (err) {
      showFlash(err.response?.data?.message ?? "Failed to load faculty.", "error");
    } finally {
      setLoading(false);
    }
  }, []); // no dependencies — args are always passed explicitly

  // Re-fetch whenever page or search changes
  useEffect(() => {
    load(page, search);
  }, [page, search]);

  const handleSearch = v => {
    setSearch(v);
    clearTimeout(timer.current);
    // Debounce: reset to page 1 after typing stops
    timer.current = setTimeout(() => {
      setPage(1); // triggers useEffect → load(1, v)
    }, 400);
  };

  // ── Flash helper ────────────────────────────────────────────────────────────
  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash({ msg: "", type: "success" }), 3000);
  };

  // ── Add — POST /api/admin/faculty ──────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.target);
    try {
      await api.post("/admin/faculty", Object.fromEntries(fd));
      showFlash("Faculty member added successfully!");
      formRef.current?.reset();
      setPage(1);
      load(1, search);
    } catch (err) {
      showFlash(err.response?.data?.message ?? "Failed to add faculty.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Update — PUT /api/admin/faculty/{id} ───────────────────────────────────
  const handleUpdate = async (id, updates) => {
    setSaving(true);
    try {
      await api.put(`/admin/faculty/${id}`, updates);
      showFlash(`${updates.name} updated successfully!`);
      setEditing(null);
      load(page, search);
    } catch (err) {
      showFlash(err.response?.data?.message ?? "Failed to update faculty.", "error");
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

  return (
    <div className="px-6 py-7">
      <PageHdr title="Faculty" sub="Create, update, and remove faculty records from the archive." />
      <Flash msg={flash.msg} type={flash.type} onClose={() => setFlash({ msg: "", type: "success" })} />

      <div className="grid items-start gap-5">
        <Card>
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

            {showAddForm && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3">
                  <CardHead title="Add Faculty Member" sub="New entries will appear on both the public and admin portals." />
                </div>
                <form ref={formRef} onSubmit={handleAdd}>
                  <Field label="Name">      <Input name="name"       placeholder="Dr. Juan Santos"     required /></Field>
                  <Field label="Title">     <Input name="title"      placeholder="Associate Professor" required /></Field>
                  <Field label="Department"><Input name="department" placeholder="CITE"                required /></Field>
                  <Field label="Short Bio"> <Textarea name="bio" placeholder="Brief background…" rows={3} /></Field>
                  <Field label="Photo">     <input type="file" name="image" accept="image/*" className="text-sm text-slate-500" /></Field>
                  <Btn type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving…" : "Save Faculty"}
                  </Btn>
                </form>
              </div>
            )}

            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5">
              <input
                type="text" value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search faculty by name, title, or department"
                className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="text-slate-400 transition hover:text-slate-600"
                >✕</button>
              )}
            </label>
          </div>

          <div className="grid gap-3.5 p-4">
            {loading
              ? Array.from({ length: PER_PAGE }).map((_, i) => (
                  <div key={i} className="flex gap-3.5 rounded-2xl border border-slate-200 p-4">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-indigo-50" />
                    <div className="flex-1">
                      <div className="mb-2 h-4 w-1/2 rounded bg-slate-200" />
                      <div className="h-3 w-1/3 rounded bg-slate-200" />
                    </div>
                  </div>
                ))
              : list.length === 0
                ? <EmptyState msg="No faculty records found." />
                : list.map(fac => (
                    <FacultyCard
                      key={fac.id}
                      fac={fac}
                      isEditing={editing === fac.id}
                      saving={saving}
                      onToggleEdit={() => setEditing(editing === fac.id ? null : fac.id)}
                      onUpdate={(updates) => handleUpdate(fac.id, updates)}
                      onDelete={() => setConfirm({ id: fac.id, name: fac.name })}
                    />
                  ))
            }
          </div>

          <Pager
            from={meta ? meta.from ?? 0 : 0}
            to={meta ? meta.to ?? 0 : 0}
            total={meta?.total ?? 0}
            hasPrev={page > 1}
            hasNext={meta ? page < meta.last_page : false}
            onPrev={() => setPage(p => p - 1)}
            onNext={() => setPage(p => p + 1)}
          />
        </Card>
      </div>

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
  const [f, setF] = useState({ name: fac.name, title: fac.title, department: fac.department, bio: fac.bio ?? "" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    setF({ name: fac.name, title: fac.title, department: fac.department, bio: fac.bio ?? "" });
  }, [fac]);

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex items-start gap-3.5">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-indigo-50 text-2xl">
          {fac.photo
            ? <img src={fac.photo} alt={fac.name} className="h-16 w-16 rounded-xl object-cover" />
            : "F"
          }
        </div>
        <div className="flex-1">
          <p className="mb-0.5 text-base font-extrabold text-slate-800">{fac.name}</p>
          <p className="mb-0.5 text-sm text-slate-500">{fac.title}</p>
          <p className="text-sm text-slate-500">{fac.department}</p>
        </div>
        <button
          onClick={onToggleEdit}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {fac.bio && !isEditing && (
        <p className="mb-1 text-sm leading-relaxed text-slate-500">{fac.bio}</p>
      )}

      {isEditing && (
        <form
          onSubmit={e => { e.preventDefault(); onUpdate(f); }}
          className="mt-3 border-t border-slate-100 pt-3.5"
        >
          <Field label="Name">       <Input value={f.name}       onChange={e => set("name", e.target.value)}       required /></Field>
          <Field label="Title">      <Input value={f.title}      onChange={e => set("title", e.target.value)}      required /></Field>
          <Field label="Department"> <Input value={f.department} onChange={e => set("department", e.target.value)} required /></Field>
          <Field label="Short Bio">  <Textarea value={f.bio}     onChange={e => set("bio", e.target.value)} rows={2} /></Field>
          <Field label="Replace Photo"><input type="file" name="image" accept="image/*" className="text-sm text-slate-500" /></Field>
          <div className="flex gap-2">
            <Btn type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Update"}
            </Btn>
            <Btn variant="danger" onClick={onDelete}>Delete</Btn>
          </div>
        </form>
      )}
    </div>
  );
}