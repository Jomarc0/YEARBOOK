/**
 * BatchSectionStudentsPage.jsx
 * NU Lipa / Sinag-Bughaw — Admin Panel
 * Simplified: Batch → Sections (grouped) → Students
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import Icon from "../components/shared/Icon";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:       "#f3f4f8", surface:  "#ffffff", border:   "#e4e7f0",
  text:     "#18213a", muted:    "#6b7590", hint:     "#9ba3bc",
  navy:     "#1e3a8a", blue:     "#3b5cf6", blueBg:   "#eef2ff",
  indigo:   "#4f46e5", purple:   "#7c3aed", purpleBg: "#f4ebff",
  teal:     "#0d9488", tealBg:   "#f0fdfa", green:    "#16a34a",
  greenBg:  "#dcfce7", amber:    "#d97706", amberBg:  "#fef3c7",
  red:      "#dc2626", redBg:    "#fee2e2",
  shadow:   "0 1px 4px rgba(30,58,138,.06), 0 2px 12px rgba(30,58,138,.06)",
  shadowMd: "0 4px 24px rgba(30,58,138,.12)",
  shadowLg: "0 8px 40px rgba(30,58,138,.16)",
};

// ─── School → Course Map (single source of truth) ────────────────────────────
const SCHOOL_MAP = {
  SACE: {
    label: "School of Architecture, Computing, and Engineering",
    color: C.blue, bg: C.blueBg,
    courses: [
      "BS Architecture",
      "BS Computer Science",
      "BS Information Technology",
      "BS Civil Engineering",
      "Bachelor of Multimedia Arts (BMMA)",
    ],
  },
  SAHS: {
    label: "School of Allied Health Sciences",
    color: C.teal, bg: C.tealBg,
    courses: [
      "BS Nursing",
      "BS Medical Technology",
      "BS Psychology",
    ],
  },
  SABM: {
    label: "School of Accountancy, Business, and Management",
    color: C.amber, bg: C.amberBg,
    courses: [
      "BS Accountancy",
      "BSBA Financial Management",
      "BSBA Marketing Management",
      "BS Tourism Management",
    ],
  },
  SHS: {
    label: "Senior High School",
    color: C.purple, bg: C.purpleBg,
    courses: ["ABM", "STEM", "HUMSS"],
  },
};

const SCHOOL_KEYS   = Object.keys(SCHOOL_MAP);
const schoolOf      = (dept) => SCHOOL_MAP[dept] ?? { label: dept, color: C.blue, bg: C.blueBg, courses: [] };
const colorOf       = (dept) => schoolOf(dept).color;
const bgOf          = (dept) => schoolOf(dept).bg;
const naturalSort   = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const normalizeSortText = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const courseAliases = {
  "bachelor of multimedia arts": "bachelor of multimedia arts bmma",
  "bachelor of multimedia arts bmma": "bachelor of multimedia arts bmma",
};

function courseRank(dept, course) {
  const courses = schoolOf(dept).courses;
  const normalizedCourse = courseAliases[normalizeSortText(course)] ?? normalizeSortText(course);
  const exactIndex = courses.findIndex(c => normalizeSortText(c) === normalizedCourse);
  if (exactIndex >= 0) return exactIndex;

  const looseIndex = courses.findIndex(c => {
    const mapped = courseAliases[normalizeSortText(c)] ?? normalizeSortText(c);
    return mapped.includes(normalizedCourse) || normalizedCourse.includes(mapped);
  });
  return looseIndex >= 0 ? looseIndex : courses.length + 1;
}

function compareSections(a, b) {
  const deptA = a.department ?? "";
  const deptB = b.department ?? "";
  const deptIndexA = SCHOOL_KEYS.indexOf(deptA);
  const deptIndexB = SCHOOL_KEYS.indexOf(deptB);
  const deptOrder = (deptIndexA >= 0 ? deptIndexA : SCHOOL_KEYS.length)
    - (deptIndexB >= 0 ? deptIndexB : SCHOOL_KEYS.length);
  if (deptOrder) return deptOrder;

  const rankOrder = courseRank(deptA, a.course) - courseRank(deptB, b.course);
  if (rankOrder) return rankOrder;

  const courseOrder = naturalSort.compare(a.course ?? "", b.course ?? "");
  if (courseOrder) return courseOrder;

  return naturalSort.compare(a.name ?? "", b.name ?? "");
}

function courseLabelFor(dept, course) {
  const normalizedCourse = courseAliases[normalizeSortText(course)] ?? normalizeSortText(course);
  const mappedCourse = schoolOf(dept).courses.find(c => {
    const mapped = courseAliases[normalizeSortText(c)] ?? normalizeSortText(c);
    return mapped === normalizedCourse || mapped.includes(normalizedCourse) || normalizedCourse.includes(mapped);
  });
  return mappedCourse ?? course ?? "Unassigned Course";
}

function groupSectionsByCourse(dept, sections) {
  return sections.reduce((groups, section) => {
    const label = courseLabelFor(dept, section.course);
    if (!groups[label]) groups[label] = [];
    groups[label].push(section);
    return groups;
  }, {});
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 14, radius = 6, style = {} }) => (
  <div
    style={{ width: w, height: h, borderRadius: radius, ...style }}
    className="animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]"
  />
);

function pill(label, color, bg) {
  return (
    <span
      style={{ color, background: bg }}
      className="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold leading-6"
    >
      {label}
    </span>
  );
}

function PillButton({ label, color, bg, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ color, background: bg }}
      className="inline-flex whitespace-nowrap rounded-full border-0 px-2 py-0.5 text-xs font-bold leading-6 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      {label}
    </button>
  );
}

function Avatar({ name = "?", photo, size = 36 }) {
  if (photo) return (
    <img src={photo} alt={name}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  );
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const palettes = [
    [C.blueBg, C.blue], [C.greenBg, C.green], [C.amberBg, C.amber],
    [C.purpleBg, C.purple], [C.tealBg, C.teal], [C.redBg, C.red],
  ];
  const [bg, fg] = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, flexShrink: 0, letterSpacing: "-.02em",
    }}>{initials}</div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`animate-[slideUp_.22s_ease] rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg ${
            t.type === "error"
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-emerald-300 bg-emerald-50 text-emerald-600"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <Overlay onClose={onCancel}>
      <ModalCard width={400}>
        <div style={{ padding: "24px 26px" }}>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: C.text, marginBottom: 10 }}>{title}</div>
          <div style={{ fontSize: "0.88rem", color: C.muted, marginBottom: 22, lineHeight: 1.65 }}>{message}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Btn>
            <Btn variant="danger" onClick={onConfirm} disabled={loading}>{loading ? "Deleting…" : "Delete"}</Btn>
          </div>
        </div>
      </ModalCard>
    </Overlay>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
const inputBase = {
  width: "100%", padding: "9px 12px", borderRadius: 10,
  border: `1.5px solid ${C.border}`, fontSize: "0.875rem",
  color: C.text, background: "#fafbfd", fontFamily: "inherit",
  boxSizing: "border-box", outline: "none", transition: "border-color .15s",
};

function Btn({ variant = "primary", children, style = {}, ...props }) {
  const variants = {
    primary: "border-transparent bg-indigo-600 text-white hover:bg-indigo-700",
    ghost: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    danger: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "border-indigo-600 bg-white text-indigo-600 hover:bg-indigo-50",
    teal: "border-transparent bg-teal-600 text-white hover:bg-teal-700",
  };
  return (
    <button
      {...props}
      style={style}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-65 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

const Field = ({ label, required, children, error }) => (
  <div className="mb-4">
    <label className="mb-1 block text-xs font-bold uppercase tracking-[0.05em] text-slate-500">
      {label}
      {required && <span className="text-red-600"> *</span>}
    </label>
    {children}
    {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
  </div>
);

function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-5" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalCard({ children, width = 540 }) {
  return (
    <div style={{ maxWidth: width }} className="w-full overflow-hidden rounded-3xl bg-white shadow-2xl animate-[fadeUp_.2s_ease]">
      {children}
    </div>
  );
}

function ModalHeader({ title, onClose, extra }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
      <div className="text-[1.08rem] font-extrabold text-slate-800">{title}</div>
      <div className="flex items-center gap-2">
        {extra}
        <button onClick={onClose} className="px-1 text-2xl leading-none text-slate-400 hover:text-slate-600">×</button>
      </div>
    </div>
  );
}

function ModalBody({ children }) {
  return <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 pb-2 pt-5">{children}</div>;
}

function ModalFooter({ children }) {
  return <div className="flex justify-end gap-2 px-6 pb-5 pt-3">{children}</div>;
}

function CardGrid({ children }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3.5">
      {children}
    </div>
  );
}

function Card({ onClick, accent = C.blue, children, actions }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface, border: `1px solid ${hovered ? accent + "55" : C.border}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: hovered ? C.shadowMd : C.shadow,
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "all .18s", display: "flex", flexDirection: "column",
      }}>
      <div style={{ height: 4, background: `linear-gradient(90deg,${accent},${accent}88)` }} />
      <div style={{ padding: "16px 18px", flex: 1, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
        {children}
      </div>
      {actions && (
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

function SmallBtn({ onClick, children, danger }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
        danger
          ? "border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Step Bar (3 steps now) ───────────────────────────────────────────────────
const STEPS = [
  { key: "batches", icon: "graduation", label: "Batches" },
  { key: "sections", icon: "book", label: "Sections" },
  { key: "students", icon: "students", label: "Students" },
];

function StepBar({ current, onSelect }) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="mb-6 flex w-fit items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {STEPS.map((s, i) => {
        const active = i === idx, done = i < idx;
        return (
          <button
            type="button"
            key={s.key}
            onClick={() => onSelect?.(s.key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition ${
              active
                ? "bg-indigo-600 text-white"
                : done
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            }`}
          >
            <Icon name={s.icon} className="h-4 w-4" />
            <span>{s.label}</span>
            {done && <Icon name="check" className="h-3.5 w-3.5 opacity-70" />}
          </button>
        );
      })}
    </div>
  );
}

function Breadcrumb({ crumbs }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-1.5">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-sm text-slate-400">/</span>}
          {c.onClick
            ? <button onClick={c.onClick} className="bg-transparent p-0 text-sm font-bold text-indigo-600">{c.label}</button>
            : <span className="text-sm font-extrabold text-slate-800">{c.label}</span>}
        </span>
      ))}
    </div>
  );
}

// ─── Batch Modal ──────────────────────────────────────────────────────────────
function BatchModal({ batch, onClose, onSaved, toast }) {
  const isEdit = !!batch?.id;
  const [form, setForm] = useState({
    name:            batch?.name            ?? "",
    graduation_year: batch?.graduation_year ?? new Date().getFullYear(),
    description:     batch?.description     ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    const e = {};
    if (!form.name.trim())     e.name = "Batch name is required.";
    if (!form.graduation_year) e.graduation_year = "Year is required.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      isEdit
        ? await api.put(`/admin/batches/${batch.id}`, form)
        : await api.post("/admin/batches", form);
      toast(isEdit ? "Batch updated." : "Batch created.");
      onSaved();
    } catch (err) { toast(err.response?.data?.message ?? "Failed to save.", "error"); }
    finally { setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={520}>
        <ModalHeader title={isEdit ? "Edit Batch" : "Create New Batch"} onClose={onClose} />
        <ModalBody>
          <Field label="Batch Name" required error={errors.name}>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Batch 2025"
              style={{ ...inputBase, borderColor: errors.name ? C.red : C.border }} />
          </Field>
          <Field label="Graduation Year" required error={errors.graduation_year}>
            <input type="number" value={form.graduation_year}
              onChange={e => set("graduation_year", parseInt(e.target.value))}
              min={2000} max={2100}
              style={{ ...inputBase, borderColor: errors.graduation_year ? C.red : C.border }} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={3} placeholder="Optional notes…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>
        </ModalBody>
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : isEdit ? "Update Batch" : "Create Batch"}</Btn>
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
}

// ─── Section Modal (smart: dept filters courses) ──────────────────────────────
function SectionModal({ section, batchId, onClose, onSaved, toast }) {
  const isEdit = !!section?.id;
  const [form, setForm] = useState({
    department:  section?.department  ?? "",
    course:      section?.course      ?? "",
    name:        section?.name        ?? "",
    batch_year:  section?.batch_year  ?? new Date().getFullYear(),
    description: section?.description ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // When department changes, reset course
  const setDept = (v) => setForm(p => ({ ...p, department: v, course: "" }));

  const availableCourses = form.department ? (SCHOOL_MAP[form.department]?.courses ?? []) : [];

  const save = async () => {
    const e = {};
    if (!form.department.trim()) e.department = "Please select a school.";
    if (!form.course.trim())     e.course     = "Please select a course.";
    if (!form.name.trim())       e.name       = "Section name is required.";
    if (Object.keys(e).length)  { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = { ...form, batch_id: batchId };
      isEdit
        ? await api.put(`/admin/sections/${section.id}`, payload)
        : await api.post("/admin/sections", payload);
      toast(isEdit ? "Section updated." : "Section created.");
      onSaved();
    } catch (err) { toast(err.response?.data?.message ?? "Failed to save.", "error"); }
    finally { setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={540}>
        <ModalHeader title={isEdit ? "Edit Section" : "Add New Section"} onClose={onClose} />
        <ModalBody>

          {/* Step 1 — School */}
          <Field label="School / Department" required error={errors.department}>
            <select value={form.department} onChange={e => setDept(e.target.value)}
              style={{ ...inputBase, cursor: "pointer", borderColor: errors.department ? C.red : C.border }}>
              <option value="">Select school…</option>
              {SCHOOL_KEYS.map(key => (
                <option key={key} value={key}>{key} — {SCHOOL_MAP[key].label}</option>
              ))}
            </select>
          </Field>

          {/* Step 2 — Course (only shows options for chosen school) */}
          <Field label="Course / Program" required error={errors.course}>
            <select
              value={form.course}
              onChange={e => set("course", e.target.value)}
              disabled={!form.department}
              style={{ ...inputBase, cursor: form.department ? "pointer" : "not-allowed", borderColor: errors.course ? C.red : C.border, opacity: form.department ? 1 : 0.55 }}>
              <option value="">{form.department ? "Select course…" : "Select a school first…"}</option>
              {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {/* Step 3 — Section details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Section Name" required error={errors.name}>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. BSCS 4-A"
                style={{ ...inputBase, borderColor: errors.name ? C.red : C.border }} />
            </Field>
            <Field label="School Year">
              <input type="number" value={form.batch_year}
                onChange={e => set("batch_year", parseInt(e.target.value))}
                min={2000} max={2100} style={inputBase} />
            </Field>
          </div>

          <Field label="Description">
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={2} placeholder="Optional notes…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>

          {/* Preview badge */}
          {form.department && form.course && form.name && (
            <div style={{ marginTop: 4, padding: "10px 14px", borderRadius: 10, background: bgOf(form.department), border: `1px solid ${colorOf(form.department)}33` }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: colorOf(form.department), textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Preview</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: C.text }}>{form.name}</div>
              <div style={{ fontSize: "0.75rem", color: C.muted }}>{form.department} · {form.course}</div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : isEdit ? "Update Section" : "Add Section"}</Btn>
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
}

// ─── Sample Student Data ──────────────────────────────────────────────────────
const SAMPLE_STUDENT = {
  first_name: "Juan", last_name: "Dela Cruz", middle_name: "Santos", nickname: "JD",
  student_no: "2025-00011", email: "juan@student.nu-lipa.edu.ph",
  birthday: "2003-06-15", hometown: "Lipa City, Batangas", honors: "Cum Laude",
  organizations: "SSC President, JPIA Member, Debate Team",
  achievements: "Best Thesis Award 2025, Dean's Lister 6 consecutive semesters",
  motto: "Work hard in silence, let success make the noise.",
  student_quote: "The future belongs to those who believe in the beauty of their dreams.",
  fondest_memory: "Our late night coding sessions before every finals week.",
  ambition: "Software Engineer at a top tech company",
  most_likely_to: "Start his own tech startup",
  future_plans: "Pursue masters degree abroad then build a startup in the Philippines.",
  message_to_batchmates: "Thank you for making every sleepless night worth it. See you at the top!",
  message_to_parents: "To my parents, everything I am is because of you. This is for you.",
  facebook_url: "https://facebook.com/juandelacruz",
  instagram_url: "https://instagram.com/juandelacruz",
  linkedin_url: "https://linkedin.com/in/juandelacruz",
  github_url: "https://github.com/juandelacruz",
};

// ─── Student Modal ────────────────────────────────────────────────────────────
function StudentModal({ student, sectionId, onClose, onSaved, toast }) {
  const isEdit = !!student?.id;
  const [form, setForm] = useState({
    first_name: student?.first_name ?? "", last_name: student?.last_name ?? "",
    middle_name: student?.middle_name ?? "", nickname: student?.nickname ?? "",
    student_no: student?.student_no ?? "", email: student?.email ?? "",
    birthday: student?.birthday ?? "", hometown: student?.hometown ?? "",
    honors: student?.honors ?? "", organizations: student?.organizations ?? "",
    motto: student?.motto ?? "", student_quote: student?.student_quote ?? "",
    fondest_memory: student?.fondest_memory ?? "", ambition: student?.ambition ?? "",
    future_plans: student?.future_plans ?? "",
    message_to_batchmates: student?.message_to_batchmates ?? "",
    message_to_parents: student?.message_to_parents ?? "",
    most_likely_to: student?.most_likely_to ?? "", achievements: student?.achievements ?? "",
    facebook_url: student?.facebook_url ?? "", instagram_url: student?.instagram_url ?? "",
    linkedin_url: student?.linkedin_url ?? "", github_url: student?.github_url ?? "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(student?.photo_url ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const photoRef = useRef(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required.";
    if (!form.last_name.trim())  e.last_name  = "Required.";
    if (!form.student_no.trim()) e.student_no = "Required.";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email.";
    return e;
  };

  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (photoFile || removePhoto) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
        if (photoFile) fd.append("photo", photoFile);
        if (removePhoto) fd.append("remove_photo", "1");
        isEdit
          ? await api.post(`/admin/sections/${sectionId}/students/${student.id}?_method=PUT`, fd, { headers: { "Content-Type": "multipart/form-data" } })
          : await api.post(`/admin/sections/${sectionId}/students/create`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        isEdit
          ? await api.put(`/admin/sections/${sectionId}/students/${student.id}`, form)
          : await api.post(`/admin/sections/${sectionId}/students/create`, form);
      }
      toast(isEdit ? "Student updated." : "Student added.");
      onSaved();
    } catch (err) {
      toast(err.response?.data?.message ?? "Failed to save student.", "error");
    } finally { setSaving(false); }
  };

  const Divider = ({ label }) => (
    <div style={{
      fontSize: "0.72rem", fontWeight: 800, color: C.blue, textTransform: "uppercase",
      letterSpacing: ".08em", margin: "18px 0 12px", paddingBottom: 6,
      borderBottom: `1.5px solid ${C.blueBg}`,
    }}>{label}</div>
  );

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={660}>
        <ModalHeader
          title={isEdit ? "Edit Student" : "Add Student"}
          onClose={onClose}
          extra={!isEdit && (
            <button onClick={() => setForm(SAMPLE_STUDENT)} style={{
              padding: "5px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", background: C.blueBg,
              color: C.blue, border: `1px solid ${C.blue}33`,
            }}>Fill Sample</button>
          )}
        />
        <ModalBody>
          <Divider label="Profile Photo" />
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 8 }}>
            <div onClick={() => photoRef.current?.click()} style={{
              width: 90, height: 90, borderRadius: 16, overflow: "hidden",
              border: `2px dashed ${C.border}`, cursor: "pointer", flexShrink: 0,
              background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {photoPreview
                ? <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center", color: C.hint }}>
                    <div style={{ fontSize: "1.8rem" }}>📷</div>
                    <div style={{ fontSize: "0.68rem", marginTop: 2 }}>Upload</div>
                  </div>
              }
            </div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Graduation / Profile Photo</div>
              <div style={{ fontSize: "0.75rem", color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
                Square photo, at least 400×400px.<br />JPG, PNG, WEBP. Max 5MB.
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Btn variant="ghost" style={{ padding: "6px 14px", fontSize: "0.78rem" }} onClick={() => photoRef.current?.click()}>
                  {photoPreview ? "Change Photo" : "Choose Photo"}
                </Btn>
                {photoPreview && (
                  <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); setRemovePhoto(isEdit); if (photoRef.current) photoRef.current.value = ""; }}
                    style={{ background: "none", border: "none", color: C.red, fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input type="file" accept="image/*" ref={photoRef} onChange={handlePhoto} style={{ display: "none" }} />
          </div>

          <Divider label="Basic Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="First Name" required error={errors.first_name}>
              <input value={form.first_name} onChange={e => set("first_name", e.target.value)}
                placeholder="Juan" style={{ ...inputBase, borderColor: errors.first_name ? C.red : C.border }} />
            </Field>
            <Field label="Last Name" required error={errors.last_name}>
              <input value={form.last_name} onChange={e => set("last_name", e.target.value)}
                placeholder="Dela Cruz" style={{ ...inputBase, borderColor: errors.last_name ? C.red : C.border }} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Middle Name">
              <input value={form.middle_name} onChange={e => set("middle_name", e.target.value)} placeholder="Optional" style={inputBase} />
            </Field>
            <Field label="Nickname">
              <input value={form.nickname} onChange={e => set("nickname", e.target.value)} placeholder="e.g. Jun" style={inputBase} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Student No." required error={errors.student_no}>
              <input value={form.student_no} onChange={e => set("student_no", e.target.value)}
                placeholder="2021-00001" style={{ ...inputBase, borderColor: errors.student_no ? C.red : C.border }} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="juan@nu-lipa.edu.ph" style={{ ...inputBase, borderColor: errors.email ? C.red : C.border }} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Birthday">
              <input type="date" value={form.birthday} onChange={e => set("birthday", e.target.value)} style={inputBase} />
            </Field>
            <Field label="Hometown">
              <input value={form.hometown} onChange={e => set("hometown", e.target.value)} placeholder="e.g. Lipa City, Batangas" style={inputBase} />
            </Field>
          </div>

          <Divider label="Academic & Achievements" />
          <Field label="Latin Honors">
            <input value={form.honors} onChange={e => set("honors", e.target.value)} placeholder="e.g. Cum Laude, Magna Cum Laude…" style={inputBase} />
          </Field>
          <Field label="Organizations / Clubs">
            <textarea value={form.organizations} onChange={e => set("organizations", e.target.value)}
              rows={2} placeholder="e.g. SSC President, JPIA Member…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>
          <Field label="Achievements / Awards">
            <textarea value={form.achievements} onChange={e => set("achievements", e.target.value)}
              rows={2} placeholder="Academic awards, competitions won…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>

          <Divider label="Yearbook Quotes & Messages" />
          <Field label="Motto">
            <textarea value={form.motto} onChange={e => set("motto", e.target.value)}
              rows={2} placeholder="Personal life motto…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>
          <Field label="Favorite Quote">
            <textarea value={form.student_quote} onChange={e => set("student_quote", e.target.value)}
              rows={2} placeholder="Favorite quote or saying…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>
          <Field label="Fondest Memory">
            <textarea value={form.fondest_memory} onChange={e => set("fondest_memory", e.target.value)}
              rows={2} placeholder="Most memorable moment in school…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Ambition / Dream Job">
              <input value={form.ambition} onChange={e => set("ambition", e.target.value)} placeholder="e.g. Software Engineer" style={inputBase} />
            </Field>
            <Field label="Most Likely To…">
              <input value={form.most_likely_to} onChange={e => set("most_likely_to", e.target.value)} placeholder="e.g. Start a company" style={inputBase} />
            </Field>
          </div>
          <Field label="Future Plans">
            <textarea value={form.future_plans} onChange={e => set("future_plans", e.target.value)}
              rows={2} placeholder="Where do you see yourself in 5 years…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>
          <Field label="Message to Batchmates">
            <textarea value={form.message_to_batchmates} onChange={e => set("message_to_batchmates", e.target.value)}
              rows={2} placeholder="Farewell message to classmates…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>
          <Field label="Message to Parents">
            <textarea value={form.message_to_parents} onChange={e => set("message_to_parents", e.target.value)}
              rows={2} placeholder="Dedication to family…" style={{ ...inputBase, resize: "vertical" }} />
          </Field>

          <Divider label="Social Links (Optional)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Facebook">
              <input value={form.facebook_url} onChange={e => set("facebook_url", e.target.value)} placeholder="https://facebook.com/…" style={inputBase} />
            </Field>
            <Field label="Instagram">
              <input value={form.instagram_url} onChange={e => set("instagram_url", e.target.value)} placeholder="https://instagram.com/…" style={inputBase} />
            </Field>
            <Field label="LinkedIn">
              <input value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" style={inputBase} />
            </Field>
            <Field label="GitHub">
              <input value={form.github_url} onChange={e => set("github_url", e.target.value)} placeholder="https://github.com/…" style={inputBase} />
            </Field>
          </div>
        </ModalBody>
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : isEdit ? "Update Student" : "Add Student"}</Btn>
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VIEW: BATCHES
// ═══════════════════════════════════════════════════════════════════
function BatchesView({ toast, onSelect, onViewStudents }) {
  const [batches,    setBatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [modal,      setModal]      = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const timer = useRef(null);

  const load = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/batches", { params: { search: q, per_page: 50 } });
      setBatches(res.data.data ?? res.data);
    } catch { toast("Failed to load batches.", "error"); }
    finally  { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, []);

  const handleSearch = v => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(v), 400);
  };

  const doDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/admin/batches/${delTarget.id}`);
      toast("Batch deleted."); setDelTarget(null); load();
    } catch { toast("Delete failed.", "error"); }
    finally { setDelLoading(false); }
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => handleSearch(e.target.value)}
          placeholder="Search batches…" className="w-full max-w-[380px] min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" />
        <Btn onClick={() => setModal({})}>+ New Batch</Btn>
      </div>

      {loading ? (
        <CardGrid>{Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton w="50%" h={14} style={{ marginBottom: 10 }} />
            <Skeleton w="75%" h={11} style={{ marginBottom: 6 }} />
            <Skeleton w="40%" h={11} />
          </div>
        ))}</CardGrid>
      ) : batches.length === 0 ? (
        <div className="px-5 py-16 text-center text-slate-500">
          <div className="mb-3 text-5xl font-black text-indigo-200">BAT</div>
          <div className="mb-1.5 text-lg font-extrabold text-slate-800">No batches yet</div>
          <div className="mb-5 text-sm">Create the first graduation batch to get started.</div>
          <Btn onClick={() => setModal({})}>+ Create First Batch</Btn>
        </div>
      ) : (
        <CardGrid>
          {batches.map(b => (
            <Card key={b.id} accent={C.blue} onClick={() => onSelect(b)}
              actions={<>
                <SmallBtn onClick={e => { e.stopPropagation(); setModal(b); }}>
                  <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                </SmallBtn>
                <SmallBtn danger onClick={e => { e.stopPropagation(); setDelTarget(b); }}>
                  <Icon name="trash" className="h-3.5 w-3.5" /> Delete
                </SmallBtn>
              </>}>
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div>
                  <div className="mb-1 text-[1.05rem] font-extrabold text-slate-800">{b.name}</div>
                  <div className="text-xs text-slate-500">{b.description || "No description."}</div>
                </div>
                {pill(`Class of ${b.graduation_year}`, C.blue, C.blueBg)}
              </div>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                <PillButton
                  label={`${b.sections_count ?? 0} sections`}
                  color={C.purple}
                  bg={C.purpleBg}
                  onClick={e => { e.stopPropagation(); onSelect(b); }}
                />
                <PillButton
                  label={`${b.students_count ?? 0} students`}
                  color={C.green}
                  bg={C.greenBg}
                  onClick={e => { e.stopPropagation(); onViewStudents(b); }}
                />
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onSelect(b); }}
                className="bg-transparent p-0 text-left text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Click to manage sections →
              </button>
            </Card>
          ))}
        </CardGrid>
      )}

      {modal !== null && (
        <BatchModal
          batch={Object.keys(modal).length ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          toast={toast}
        />
      )}
      <ConfirmModal
        open={!!delTarget} title="Delete Batch"
        message={`Permanently delete "${delTarget?.name}" and all its sections?`}
        onConfirm={doDelete} onCancel={() => setDelTarget(null)} loading={delLoading}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VIEW: SECTIONS (flat list, grouped by school, filterable)
// ═══════════════════════════════════════════════════════════════════
function SectionsView({ batch, toast, onSelect }) {
  const [sections,   setSections]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [filterDept, setFilterDept] = useState(""); // "" = all
  const [search,     setSearch]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/sections", { params: { batch_id: batch.id, per_page: 300 } });
      setSections(res.data.data ?? res.data);
    } catch { toast("Failed to load sections.", "error"); }
    finally { setLoading(false); }
  }, [batch.id]);

  useEffect(() => { load(); }, [load]);

  const doDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/admin/sections/${delTarget.id}`);
      toast("Section deleted."); setDelTarget(null); load();
    } catch { toast("Delete failed.", "error"); }
    finally { setDelLoading(false); }
  };

  // Filter + search
  const filtered = sections.filter(s => {
    const matchDept   = !filterDept || s.department === filterDept;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.course?.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  }).sort(compareSections);

  // Group by department
  const grouped = {};
  filtered.forEach(s => {
    const dept = s.department ?? "Unknown";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(s);
  });

  const deptKeys = Object.keys(grouped).sort((a, b) => {
    const indexA = SCHOOL_KEYS.indexOf(a);
    const indexB = SCHOOL_KEYS.indexOf(b);
    return (indexA >= 0 ? indexA : SCHOOL_KEYS.length)
      - (indexB >= 0 ? indexB : SCHOOL_KEYS.length)
      || naturalSort.compare(a, b);
  });

  // Unique departments present in this batch
  const presentDepts = [...new Set(sections.map(s => s.department).filter(Boolean))]
    .sort((a, b) => {
      const indexA = SCHOOL_KEYS.indexOf(a);
      const indexB = SCHOOL_KEYS.indexOf(b);
      return (indexA >= 0 ? indexA : SCHOOL_KEYS.length)
        - (indexB >= 0 ? indexB : SCHOOL_KEYS.length)
        || naturalSort.compare(a, b);
    });

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-slate-800">{batch.name}</div>
          <div className="mt-0.5 text-sm text-slate-500">
            Class of {batch.graduation_year} · {sections.length} sections
          </div>
        </div>
        <Btn onClick={() => setModal({})}>+ Add Section</Btn>
      </div>

      {/* Filters toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search sections or courses…"
          className="w-full max-w-[320px] min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
        />
        <select
          value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200">
          <option value="">All Schools</option>
          {presentDepts.map(d => (
            <option key={d} value={d}>{d} — {SCHOOL_MAP[d]?.label ?? d}</option>
          ))}
        </select>
        {(filterDept || search) && (
          <button onClick={() => { setFilterDept(""); setSearch(""); }}
            className="bg-transparent text-sm font-bold text-indigo-600">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <CardGrid>{Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4.5">
            <Skeleton w="40%" h={14} style={{ marginBottom: 8 }} />
            <Skeleton w="60%" h={11} />
          </div>
        ))}</CardGrid>
      ) : sections.length === 0 ? (
        <div className="px-5 py-16 text-center text-slate-500">
          <div className="mb-3 text-4xl font-black text-indigo-200">SEC</div>
          <div className="mb-1.5 text-base font-extrabold text-slate-800">No sections yet</div>
          <div className="mb-5 text-sm">Add the first section to this batch.</div>
          <Btn onClick={() => setModal({})}>+ Add First Section</Btn>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-slate-500">
          <div className="mb-2 text-3xl font-black text-slate-300">N/A</div>
          <div className="font-bold text-slate-800">No sections match your filter.</div>
          <button onClick={() => { setFilterDept(""); setSearch(""); }}
            className="mt-3 bg-transparent text-sm font-bold text-indigo-600">
            Clear filters
          </button>
        </div>
      ) : (
        deptKeys.map(dept => {
          const color = colorOf(dept);
          const bg    = bgOf(dept);
          const school = SCHOOL_MAP[dept];
          const courseGroups = groupSectionsByCourse(dept, grouped[dept]);
          const courseKeys = Object.keys(courseGroups).sort((a, b) => {
            const rankOrder = courseRank(dept, a) - courseRank(dept, b);
            return rankOrder || naturalSort.compare(a, b);
          });
          return (
            <div key={dept} className="mb-8">
              {/* School group header */}
              <div style={{ borderBottomColor: `${color}22` }} className="mb-3 flex items-center gap-2.5 border-b-2 pb-2.5">
                <div style={{
                  padding: "4px 12px", borderRadius: 8, fontWeight: 800,
                  fontSize: "0.82rem", background: bg, color,
                }}>
                  {dept}
                </div>
                <div className="text-sm font-semibold text-slate-500">
                  {school?.label ?? dept}
                </div>
                <div className="ml-auto">
                  {pill(`${grouped[dept].length} sections`, color, bg)}
                </div>
              </div>

              <div className="space-y-5">
                {courseKeys.map(course => (
                  <div key={`${dept}-${course}`}>
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      <div style={{ color }} className="text-sm font-extrabold">
                        {course}
                      </div>
                      <div className="h-px min-w-[80px] flex-1 bg-slate-200" />
                      {pill(`${courseGroups[course].length} sections`, color, bg)}
                    </div>
                    <CardGrid>
                {courseGroups[course].map(s => (
                  <Card key={s.id} accent={color} onClick={() => onSelect(s)}
                    actions={<>
                      <SmallBtn onClick={e => { e.stopPropagation(); setModal(s); }}>
                        <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                      </SmallBtn>
                      <SmallBtn danger onClick={e => { e.stopPropagation(); setDelTarget(s); }}>
                        <Icon name="trash" className="h-3.5 w-3.5" /> Delete
                      </SmallBtn>
                    </>}>
                    <div className="mb-1.5 flex items-start justify-between">
                      <div className="text-base font-extrabold text-slate-800">{s.name}</div>
                      {pill(`${s.students_count ?? 0} students`, C.green, C.greenBg)}
                    </div>
                    <div className="mb-2 text-xs text-slate-500">
                      {s.course}
                    </div>
                    <div style={{ color }} className="text-xs font-bold">
                      Click to manage students →
                    </div>
                  </Card>
                ))}
                    </CardGrid>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {modal !== null && (
        <SectionModal
          section={Object.keys(modal).length ? modal : null}
          batchId={batch.id}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          toast={toast}
        />
      )}
      <ConfirmModal
        open={!!delTarget} title="Delete Section"
        message={`Delete "${delTarget?.name}"? Students will be unlinked but not deleted.`}
        onConfirm={doDelete} onCancel={() => setDelTarget(null)} loading={delLoading}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VIEW: STUDENTS
// ═══════════════════════════════════════════════════════════════════
function StudentsView({ batch, section, toast }) {
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [modal,      setModal]      = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [importing,  setImporting]  = useState(false);
  const fileRef = useRef(null);
  const timer   = useRef(null);
  const isBatchWide = !section?.id;

  const load = useCallback(async (q = search) => {
    setLoading(true);
    try {
      if (isBatchWide) {
        const res = await api.get(`/admin/batches/${batch.id}`);
        const rawBatch = res.data.data ?? res.data.batch ?? res.data;
        const allStudents = (rawBatch.sections ?? []).flatMap(sec =>
          (sec.students ?? []).map(student => ({ ...student, _section: sec }))
        );
        const term = q.trim().toLowerCase();
        setStudents(term
          ? allStudents.filter(s =>
              `${s.first_name ?? ""} ${s.last_name ?? ""} ${s.middle_name ?? ""} ${s.student_no ?? ""} ${s.email ?? ""} ${s._section?.name ?? ""}`
                .toLowerCase()
                .includes(term)
            )
          : allStudents
        );
      } else {
        const res = await api.get(`/admin/sections/${section.id}/students`, { params: { search: q, per_page: 200 } });
        const raw = res.data;
        setStudents(Array.isArray(raw) ? raw : Array.isArray(raw.data) ? raw.data : []);
      }
    } catch { toast("Failed to load students.", "error"); setStudents([]); }
    finally { setLoading(false); }
  }, [batch.id, isBatchWide, section?.id, search]);

  useEffect(() => { load(); }, [batch.id, section?.id]);

  const handleSearch = v => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(v), 400);
  };

  const doDelete = async () => {
    setDelLoading(true);
    try {
      const targetSectionId = section?.id ?? delTarget?._section?.id ?? delTarget?.section_id;
      await api.delete(`/admin/sections/${targetSectionId}/students/${delTarget.id}`);
      toast("Student removed."); setDelTarget(null); load();
    } catch (err) {
      toast(err.response?.data?.message ?? "Remove failed.", "error");
    }
    finally { setDelLoading(false); }
  };

  const handleCSV = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = text.split("\n").map(r => r.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
      const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, "_"));
      const parsed  = rows.slice(1).filter(r => r.length > 1 && r[0]).map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = r[i] ?? ""; });
        return obj;
      });
      await api.post(`/admin/sections/${section.id}/students/import`, { students: parsed });
      toast(`${parsed.length} students imported.`); load();
    } catch { toast("Import failed. Check CSV format.", "error"); }
    finally { setImporting(false); e.target.value = ""; }
  };

  const withHonors = students.filter(s => s.honors).length;
  const color = colorOf(section?.department);
  const bg    = bgOf(section?.department);

  return (
    <>
      {/* Section info banner */}
      <div style={{ borderLeftColor: color }} className="mb-4.5 flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 border-l-4 bg-white px-4.5 py-3.5 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <div className="text-base font-extrabold text-slate-800">{section?.name ?? `${batch.name} Students`}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {section
              ? `${batch.name} · ${section.department} · ${section.course}`
              : `Class of ${batch.graduation_year} · All sections`}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {pill(`${students.length} enrolled`, color, bg)}
          {withHonors > 0 && pill(`${withHonors} with honors`, C.amber, C.amberBg)}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <input value={search} onChange={e => handleSearch(e.target.value)}
          placeholder="Search students…" className="w-full max-w-[360px] min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" />
        {!isBatchWide && <input type="file" accept=".csv" ref={fileRef} onChange={handleCSV} style={{ display: "none" }} />}
        {!isBatchWide && <Btn variant="ghost" onClick={() => fileRef.current?.click()} disabled={importing}>
          {importing ? "Importing…" : "⬆ Import CSV"}
        </Btn>}
        {!isBatchWide && <Btn onClick={() => setModal({})}>+ Add Student</Btn>}
      </div>

      {!isBatchWide && <div className="mb-3.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-800">
        CSV columns: <strong>first_name, last_name, middle_name, student_no, email, honors</strong> — first row is the header.
      </div>}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["#", "Student", ...(isBatchWide ? ["Section"] : []), "Student No.", "Email", "Honors", "Actions"].map(h => (
                  <th key={h} className="whitespace-nowrap px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-[0.05em] text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{[36, 180, 100, 160, 110, 80].map((w, j) => (
                      <td key={j} className="border-b border-slate-200 px-3.5 py-3"><Skeleton w={w} h={13} /></td>
                    ))}</tr>
                  ))
                : students.length === 0 ? <tr><td colSpan={isBatchWide ? 7 : 6} className="px-5 py-12 text-center text-slate-500">
                      <div className="mb-2 text-4xl font-black text-slate-300">STU</div>
                      <div className="mb-1.5 font-bold text-slate-800">No students yet</div>
                      <div className="text-sm">Add students manually or import a CSV file.</div>
                    </td></tr>
                  : students.map((s, idx) => (
                      <tr key={s.id}
                        onMouseEnter={e => e.currentTarget.style.background = "#f6f8ff"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td className="border-b border-slate-200 px-3.5 py-3 text-xs text-slate-400">{idx + 1}</td>
                        <td className="border-b border-slate-200 px-3.5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={`${s.first_name} ${s.last_name}`} photo={s.photo_url} size={36} />
                            <div>
                              <div className="font-bold text-slate-800">
                                {s.last_name}, {s.first_name}
                                {s.middle_name ? ` ${s.middle_name.charAt(0)}.` : ""}
                              </div>
                              <div className="text-xs text-slate-500">
                                {s.nickname ? `"${s.nickname}" · ` : ""}{s.student_no}
                              </div>
                            </div>
                          </div>
                        </td>
                        {isBatchWide && (
                          <td className="border-b border-slate-200 px-3.5 py-3 text-sm text-slate-500">
                            {s._section?.name ?? "—"}
                          </td>
                        )}
                        <td className="border-b border-slate-200 px-3.5 py-3 font-mono text-sm text-slate-800">{s.student_no ?? "—"}</td>
                        <td className="border-b border-slate-200 px-3.5 py-3 text-sm text-slate-500">{s.email ?? "—"}</td>
                        <td className="border-b border-slate-200 px-3.5 py-3">
                          {s.honors
                            ? pill(s.honors, C.amber, C.amberBg)
                            : <span className="text-sm text-slate-400">—</span>}
                        </td>
                        <td className="whitespace-nowrap border-b border-slate-200 px-3.5 py-3">
                          <div className="flex gap-1.5">
                            <SmallBtn onClick={() => setModal(s)}>
                              <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                            </SmallBtn>
                            <SmallBtn danger onClick={() => setDelTarget(s)}>
                              <Icon name="trash" className="h-3.5 w-3.5" /> Remove
                            </SmallBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <StudentModal
          student={Object.keys(modal).length ? modal : null}
          sectionId={section?.id ?? modal?._section?.id ?? modal?.section_id}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          toast={toast}
        />
      )}
      <ConfirmModal
        open={!!delTarget} title="Remove Student"
        message={`Remove "${delTarget?.first_name} ${delTarget?.last_name}" from ${section?.name ?? delTarget?._section?.name ?? batch.name}?`}
        onConfirm={doDelete} onCancel={() => setDelTarget(null)} loading={delLoading}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT PAGE
// ═══════════════════════════════════════════════════════════════════
export default function BatchSectionStudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = ["batches", "sections", "students"].includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "batches";
  const [view,    setView]    = useState(initialView);
  const [batch,   setBatch]   = useState(null);
  const [section, setSection] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const { toasts, push: toast } = useToast();

  const updateRoute = useCallback((nextView, nextBatch = null, nextSection = null, replace = false) => {
    const params = {};
    if (nextView && nextView !== "batches") params.tab = nextView;
    if (nextBatch?.id) params.batch_id = String(nextBatch.id);
    if (nextSection?.id) params.section_id = String(nextSection.id);
    setSearchParams(params, { replace });
  }, [setSearchParams]);

  const go = {
    batches:  ()  => { setView("batches");  setBatch(null); setSection(null); updateRoute("batches"); },
    sections: (b) => { setBatch(b);         setView("sections"); setSection(null); updateRoute("sections", b); },
    batchStudents: (b) => { setBatch(b);    setView("students"); setSection(null); updateRoute("students", b); },
    students: (s) => { setSection(s);       setView("students"); updateRoute("students", batch, s); },
  };

  useEffect(() => {
    const tab = ["batches", "sections", "students"].includes(searchParams.get("tab"))
      ? searchParams.get("tab")
      : "batches";
    const batchId = searchParams.get("batch_id");
    const sectionId = searchParams.get("section_id");

    if (tab === "batches" || !batchId) {
      setView("batches");
      setBatch(null);
      setSection(null);
      return;
    }

    const loadRouteSection = async () => {
      if (!sectionId) {
        setSection(null);
        return;
      }
      try {
        const res = await api.get(`/admin/sections/${sectionId}`);
        setSection(res.data.data ?? res.data.section ?? res.data);
      } catch {
        setSection(null);
      }
    };

    const loadRouteBatch = async () => {
      if (batch && String(batch.id) === String(batchId)) {
        setView(tab);
        if (tab === "students") await loadRouteSection();
        else setSection(null);
        return;
      }

      setRouteLoading(true);
      try {
        const res = await api.get(`/admin/batches/${batchId}`);
        const nextBatch = res.data.data ?? res.data.batch ?? res.data;
        setBatch(nextBatch);
        setView(tab);
        if (tab === "students") await loadRouteSection();
        else setSection(null);
      } catch {
        toast("Failed to open selected batch.", "error");
        setView("batches");
        setBatch(null);
        setSection(null);
        updateRoute("batches", null, null, true);
      } finally {
        setRouteLoading(false);
      }
    };

    loadRouteBatch();
  }, [searchParams, batch, toast, updateRoute]);

  const crumbs = [
    { label: "Batches", onClick: view !== "batches" ? go.batches : null },
    ...(batch   ? [{ label: batch.name,   onClick: view !== "sections" ? () => go.sections(batch) : null }] : []),
    ...(view === "students" ? [{ label: section?.name ?? "Students" }] : []),
  ];

  const handleStepSelect = key => {
    if (key === "batches") go.batches();
    if (key === "sections") batch ? go.sections(batch) : go.batches();
    if (key === "students") batch ? go.batchStudents(batch) : go.batches();
  };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #3b5cf6 !important; box-shadow: 0 0 0 3px rgba(59,92,246,.12); }
      `}</style>

      <div className="min-h-screen bg-slate-50 px-6 py-7 animate-[fadeUp_.3s_ease]">
        <div className="mb-5">
          <h1 className="text-3xl font-black tracking-tight text-slate-800">
            Batch & Graduating Class Management
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage graduating batches, sections, and students. Sections are organized by school and course.
          </p>
        </div>

        <StepBar current={view} onSelect={handleStepSelect} />
        {crumbs.length > 1 && <Breadcrumb crumbs={crumbs} />}

        <div key={view} className="animate-[fadeUp_.2s_ease]">
          {routeLoading && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
              Loading selected batch...
            </div>
          )}
          {view === "batches"  && <BatchesView  toast={toast} onSelect={go.sections} onViewStudents={go.batchStudents} />}
          {view === "sections" && batch         && <SectionsView batch={batch} toast={toast} onSelect={go.students} />}
          {view === "students" && batch          && <StudentsView batch={batch} section={section} toast={toast} />}
        </div>
      </div>

      <Toast toasts={toasts} />
    </>
  );
}
