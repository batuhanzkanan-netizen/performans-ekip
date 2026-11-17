export function readTab() {
  try {
    return decodeURIComponent(location.hash.slice(1)) || "all";
  } catch {
    return "all";
  }
}
export const state = {
  user: null,
  authReady: false,
  editor: false,
  accessReady: false,
  accessDenied: false,
  trainers: [],
  tasks: [],
  tab: readTab(),
  sort: "added",
  trainerFilter: "all",
  priorityFilter: "all",
  online: navigator.onLine,
  loaded: { trainers: false, tasks: false },
  cached: { trainers: true, tasks: true },
  pending: { trainers: false, tasks: false },
  error: "",
  configured: false,
};
export const priorities = { 1: "Az önemli", 2: "Orta önemli", 3: "Çok önemli" };
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const overdue = (t) => !t.done && !!t.due && t.due < today();
export function visibleTasks(s = state) {
  return s.tasks
    .filter(
      (t) =>
        (s.tab === "all" || t.trainerId === s.tab) &&
        (s.tab !== "all" ||
          s.trainerFilter === "all" ||
          t.trainerId === s.trainerFilter) &&
        (s.tab !== "all" ||
          s.priorityFilter === "all" ||
          t.priority === Number(s.priorityFilter)),
    )
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        (s.sort === "priority"
          ? b.priority - a.priority
          : s.sort === "due"
            ? (a.due || "9999").localeCompare(b.due || "9999")
            : 0) ||
        a.createdAt - b.createdAt ||
        a.id.localeCompare(b.id),
    );
}
export const escapeHTML = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function noteLink(note = "") {
  const match = note.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) return null;
  try {
    const u = new URL(match[0]);
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
