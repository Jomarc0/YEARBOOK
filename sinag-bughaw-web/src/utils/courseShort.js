export const COURSE_SHORT = {
  'Bachelor of Science in Architecture': 'BSArch',
  'Bachelor of Science in Civil Engineering': 'BSCE',
  'Bachelor of Science in Computer Science': 'BSCS',
  'Bachelor of Science in Information Technology': 'BSIT',
  'Bachelor of Multimedia Arts': 'BMA',
  'Bachelor of Science in Nursing': 'BSN',
  'Bachelor of Science in Medical Technology': 'BSMT',
  'Bachelor of Science in Psychology': 'BSPsy',
  'Bachelor of Science in Accountancy': 'BSA',
  'Bachelor of Science in Business Administration - Financial Management': 'BSBA-FM',
  'Bachelor of Science in Business Administration - Marketing Management': 'BSBA-MM',
  'Bachelor of Science in Tourism Management': 'BSTM',
  'Master in Management': 'MM',
  ABM: 'ABM',
  STEM: 'STEM',
  HUMSS: 'HUMSS',
};

export const COURSE_FILTERS = [
  { label: 'All Programs', value: 'All Programs' },
  ...Object.entries(COURSE_SHORT).map(([value, label]) => ({ label, value })),
];

export function getCourseShort(course, fallback = 'Student') {
  return COURSE_SHORT[course] || course || fallback;
}
