const ICON_ALIASES = {
  "fa-arrow-right": "chevronRight",
  "fa-ban": "close",
  "fa-bell": "bell",
  "fa-bell-slash": "bell",
  "fa-bolt": "warning",
  "fa-bullhorn": "bell",
  "fa-calendar": "calendar",
  "fa-chalkboard-user": "user",
  "fa-chart-bar": "analytics",
  "fa-chart-line": "analytics",
  "fa-circle-dot": "check",
  "fa-circle-exclamation": "warning",
  "fa-circle-info": "warning",
  "fa-database": "database",
  "fa-download": "upload",
  "fa-envelope": "mail",
  "fa-exclamation": "warning",
  "fa-eye": "eye",
  "fa-file-lines": "file",
  "fa-fire": "warning",
  "fa-gear": "settings",
  "fa-image": "gallery",
  "fa-images": "gallery",
  "fa-inbox": "archive",
  "fa-info-circle": "warning",
  "fa-list": "book",
  "fa-list-check": "check",
  "fa-music": "media",
  "fa-paper-plane": "mail",
  "fa-pen": "edit",
  "fa-pen-to-square": "edit",
  "fa-peso-sign": "database",
  "fa-right-to-bracket": "logout",
  "fa-rotate-right": "spinner",
  "fa-search": "search",
  "fa-spinner": "spinner",
  "fa-star-half-stroke": "crown",
  "fa-times": "close",
  "fa-trash": "trash",
  "fa-triangle-exclamation": "warning",
  "fa-upload": "upload",
  "fa-user": "user",
  "fa-user-graduate": "graduation",
  "fa-user-plus": "users",
  "fa-user-slash": "user",
  "fa-users": "users",
  "fa-video": "video",
};

const ICONS = {
  analytics: [
    ["path", { d: "M4 19V5" }],
    ["path", { d: "M4 19h16" }],
    ["path", { d: "M8 15v-4" }],
    ["path", { d: "M12 15V8" }],
    ["path", { d: "M16 15v-7" }],
  ],
  archive: [["path", { d: "M4 7h16" }], ["path", { d: "M6 7v14h12V7" }], ["path", { d: "M9 11h6" }], ["path", { d: "M7 3h10l1 4H6z" }]],
  bell: [["path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" }], ["path", { d: "M10 21h4" }]],
  book: [["path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }], ["path", { d: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" }]],
  calendar: [["path", { d: "M8 2v4" }], ["path", { d: "M16 2v4" }], ["path", { d: "M3 10h18" }], ["rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }]],
  check: [["path", { d: "m5 12 4 4L19 6" }]],
  chevronLeft: [["path", { d: "m15 18-6-6 6-6" }]],
  chevronRight: [["path", { d: "m9 18 6-6-6-6" }]],
  close: [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]],
  crown: [["path", { d: "m3 7 5 5 4-8 4 8 5-5-2 13H5z" }], ["path", { d: "M5 20h14" }]],
  dashboard: [["path", { d: "M3 13h8V3H3z" }], ["path", { d: "M13 21h8V11h-8z" }], ["path", { d: "M13 3v6h8V3z" }], ["path", { d: "M3 21h8v-6H3z" }]],
  database: [["ellipse", { cx: "12", cy: "5", rx: "8", ry: "3" }], ["path", { d: "M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" }], ["path", { d: "M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" }]],
  edit: [["path", { d: "M12 20h9" }], ["path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" }]],
  eye: [["path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" }], ["circle", { cx: "12", cy: "12", r: "3" }]],
  file: [["path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }], ["path", { d: "M14 2v6h6" }]],
  gallery: [["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }], ["circle", { cx: "8.5", cy: "8.5", r: "1.5" }], ["path", { d: "m21 15-5-5L5 21" }]],
  graduation: [["path", { d: "M22 10 12 5 2 10l10 5z" }], ["path", { d: "M6 12v5c3 3 9 3 12 0v-5" }]],
  library: [["path", { d: "M4 19V5" }], ["path", { d: "M8 19V5" }], ["path", { d: "M12 19V5" }], ["path", { d: "M16 19V5" }], ["path", { d: "M20 19V5" }], ["path", { d: "M3 19h18" }]],
  lock: [["rect", { x: "5", y: "11", width: "14", height: "10", rx: "2" }], ["path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }]],
  logout: [["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }], ["path", { d: "m16 17 5-5-5-5" }], ["path", { d: "M21 12H9" }]],
  mail: [["path", { d: "M4 4h16v16H4z" }], ["path", { d: "m4 7 8 6 8-6" }]],
  media: [["path", { d: "M4 5h16v14H4z" }], ["path", { d: "m10 9 5 3-5 3z" }]],
  plus: [["path", { d: "M12 5v14" }], ["path", { d: "M5 12h14" }]],
  reports: [["path", { d: "M6 2h9l5 5v15H6z" }], ["path", { d: "M14 2v6h6" }], ["path", { d: "M9 17h6" }], ["path", { d: "M9 13h8" }]],
  restore: [["path", { d: "M3 12a9 9 0 1 0 3-6.7" }], ["path", { d: "M3 3v6h6" }]],
  search: [["circle", { cx: "11", cy: "11", r: "7" }], ["path", { d: "m21 21-4.3-4.3" }]],
  settings: [["circle", { cx: "12", cy: "12", r: "3" }], ["path", { d: "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V22a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.3 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 10 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1z" }]],
  shield: [["path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }]],
  spinner: [["path", { d: "M21 12a9 9 0 0 1-9 9" }]],
  students: [["path", { d: "M16 21v-2a4 4 0 0 0-8 0v2" }], ["circle", { cx: "12", cy: "7", r: "4" }], ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.8" }], ["path", { d: "M16 3.1a4 4 0 0 1 0 7.8" }]],
  trash: [["path", { d: "M3 6h18" }], ["path", { d: "M8 6V4h8v2" }], ["path", { d: "M6 6l1 16h10l1-16" }], ["path", { d: "M10 11v6" }], ["path", { d: "M14 11v6" }]],
  upload: [["path", { d: "M12 16V4" }], ["path", { d: "m7 9 5-5 5 5" }], ["path", { d: "M4 20h16" }]],
  user: [["circle", { cx: "12", cy: "8", r: "4" }], ["path", { d: "M4 22a8 8 0 0 1 16 0" }]],
  users: [["path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }], ["circle", { cx: "9", cy: "7", r: "4" }], ["path", { d: "M23 21v-2a4 4 0 0 0-3-3.8" }], ["path", { d: "M16 3.1a4 4 0 0 1 0 7.8" }]],
  video: [["rect", { x: "3", y: "5", width: "14", height: "14", rx: "2" }], ["path", { d: "m17 9 5-3v12l-5-3z" }]],
  warning: [["path", { d: "M12 9v4" }], ["path", { d: "M12 17h.01" }], ["path", { d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" }]],
};

export default function Icon({ name, className = "h-4 w-4", strokeWidth = 2, title }) {
  const iconName = ICON_ALIASES[name] ?? name;
  const nodes = ICONS[iconName] ?? ICONS.dashboard;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {nodes.map(([Tag, attrs], index) => <Tag key={index} {...attrs} />)}
    </svg>
  );
}
