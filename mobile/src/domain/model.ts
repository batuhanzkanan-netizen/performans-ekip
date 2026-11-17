export type Trainer = {
  id: string;
  name: string;
  order: number;
  createdAt: number;
  deleting?: boolean;
};
export type Task = {
  id: string;
  title: string;
  trainerId: string;
  priority: 1 | 2 | 3;
  due: string | null;
  done: boolean;
  doneAt: number | null;
  note: string;
  createdAt: number;
  updatedAt: number;
};
export type User = {
  uid: string;
  email: string | null;
  name: string | null;
  verified: boolean;
};
export type Snapshot = {
  user: User | null;
  ready: boolean;
  allowed: boolean;
  editor: boolean;
  accessReady: boolean;
  trainers: Trainer[];
  tasks: Task[];
  online: boolean;
  loaded: boolean;
  pending: boolean;
  cached: boolean;
  error: string;
  demo: boolean;
};
export const priorityNames = {
  1: "Az önemli",
  2: "Orta önemli",
  3: "Çok önemli",
} as const;
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const isLate = (t: Task) => !t.done && !!t.due && t.due < localDate();
export function selectTasks(
  tasks: Task[],
  tab: string,
  sort: string,
  trainerFilter = "all",
  priorityFilter = "all",
) {
  return tasks
    .filter(
      (t) =>
        (tab === "all" || t.trainerId === tab) &&
        (tab !== "all" ||
          trainerFilter === "all" ||
          t.trainerId === trainerFilter) &&
        (tab !== "all" ||
          priorityFilter === "all" ||
          t.priority === Number(priorityFilter)),
    )
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        (sort === "priority"
          ? b.priority - a.priority
          : sort === "due"
            ? (a.due || "9999").localeCompare(b.due || "9999")
            : 0) ||
        a.createdAt - b.createdAt ||
        a.id.localeCompare(b.id),
    );
}
export function firstLink(note: string) {
  const raw = note.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !isNaN(d.getTime()) && localDate(d) === value;
}
export function canEdit(
  email: string | null,
  verified: boolean,
  editors: string[],
) {
  return !!email && verified && editors.includes(email);
}
export function canRead(
  email: string | null,
  verified: boolean,
  editors: string[],
  viewers: string[],
) {
  return (
    canEdit(email, verified, editors) ||
    (!!email && verified && viewers.includes(email))
  );
}
