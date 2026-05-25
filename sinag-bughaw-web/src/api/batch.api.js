import client from './client';

// ── Batch Discovery API ───────────────────────────────────────────────────────

export const batchApi = {
  /** All batches grouped by department. */
  all: (params = {}) => client.get('/batches', { params }),

  /** Single batch detail + stats. */
  show: (batchId) => client.get(`/batches/${batchId}`),

  /** Paginated students in a batch (premium-gated). */
  students: (batchId, page = 1) =>
    client.get(`/batches/${batchId}/students`, { params: { page } }),

  // ── View Modes ─────────────────────────────────────────────────────────

  /** VIEW MODE: Batch — my batchmates (same course + year). */
  batchmates: (params = {}) =>
    client.get('/batchmates', { params }),

  /** VIEW MODE: Section — my section classmates only. */
  sectionmates: () =>
    client.get('/discover/sectionmates'),

  /** VIEW MODE: Whole School — all students, server-side paginated + filtered. */
  wholeSchool: (params = {}) =>
    client.get('/discover/school', { params }),

  /** VIEW MODE: Cross-Program — students from other courses, Fuse.js client-side. */
  crossProgram: (params = {}) =>
    client.get('/discover/cross-program', { params }),

  /** Department view — grouped by course. */
  byDepartment: (department) =>
    client.get(`/discover/department/${encodeURIComponent(department)}`),
};

export const sectionsApi = {
  list: (params = {}) => client.get('/sections', { params }),
  show: (id)          => client.get(`/sections/${id}`),
};

// ── Constants ─────────────────────────────────────────────────────────────────

export const COURSES = [
  { label: 'All Programs',  value: null },
  { label: 'BSCS',          value: 'Bachelor of Science in Computer Science' },
  { label: 'BSIT',          value: 'Bachelor of Science in Information Technology' },
  { label: 'BSCE',          value: 'Bachelor of Science in Civil Engineering' },
  { label: 'BSME',          value: 'Bachelor of Science in Mechanical Engineering' },
  { label: 'Nursing',       value: 'Bachelor of Science in Nursing' },
  { label: 'Accountancy',   value: 'Bachelor of Science in Accountancy' },
  { label: 'Psychology',    value: 'Bachelor of Science in Psychology' },
  { label: 'Education',     value: 'Bachelor of Education' },
];

export const DEPARTMENTS = [
  'College of Computing',
  'College of Engineering',
  'College of Nursing',
  'College of Business and Accountancy',
  'College of Liberal Arts',
  'College of Education',
];

export const COURSE_LABELS = Object.fromEntries(
  COURSES.filter(c => c.value).map(c => [c.value, c.label])
);

export const COURSE_TO_DEPT = {
  'Bachelor of Science in Computer Science':       'College of Computing',
  'Bachelor of Science in Information Technology': 'College of Computing',
  'Bachelor of Science in Civil Engineering':      'College of Engineering',
  'Bachelor of Science in Mechanical Engineering': 'College of Engineering',
  'Bachelor of Science in Nursing':                'College of Nursing',
  'Bachelor of Science in Accountancy':            'College of Business and Accountancy',
  'Bachelor of Science in Psychology':             'College of Liberal Arts',
  'Bachelor of Education':                         'College of Education',
};

export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_OPTIONS  = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + 2 - i);