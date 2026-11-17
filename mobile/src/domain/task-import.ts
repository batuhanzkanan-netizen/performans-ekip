import type { Task, Trainer } from "./model";
import { validDate } from "./model";
export type TaskPackage = {
  version: 1;
  trainers: { id: string; name: string }[];
  tasks: {
    id: string;
    trainerId: string;
    title: string;
    note: string;
    due: string | null;
    priority: 1 | 2 | 3;
  }[];
};
export function validatePackage(value: unknown): TaskPackage {
  if (!value || typeof value !== "object")
    throw new Error("Görev listesi okunamadı.");
  const d = value as TaskPackage;
  if (
    d.version !== 1 ||
    !Array.isArray(d.trainers) ||
    !Array.isArray(d.tasks) ||
    d.trainers.length > 100 ||
    d.tasks.length > 1000
  )
    throw new Error("Görev listesi biçimi geçersiz.");
  const ids = new Set<string>(),
    taskIds = new Set<string>();
  for (const t of d.trainers) {
    if (
      !t ||
      typeof t.id !== "string" ||
      !t.id ||
      ids.has(t.id) ||
      typeof t.name !== "string" ||
      !t.name.trim() ||
      t.name.length > 100
    )
      throw new Error("Eğitmen listesi geçersiz.");
    ids.add(t.id);
  }
  for (const t of d.tasks) {
    if (
      !t ||
      typeof t.id !== "string" ||
      !t.id ||
      taskIds.has(t.id) ||
      !ids.has(t.trainerId) ||
      typeof t.title !== "string" ||
      !t.title.trim() ||
      t.title.length >= 200 ||
      typeof t.note !== "string" ||
      t.note.length > 5000 ||
      ![1, 2, 3].includes(t.priority) ||
      (t.due !== null && (typeof t.due !== "string" || !validDate(t.due)))
    )
      throw new Error("Görev alanlarını kontrol edip yeniden yükle.");
    taskIds.add(t.id);
  }
  return d;
}
export function mergePackage(
  existing: { trainers: Trainer[]; tasks: Task[] },
  input: unknown,
  now = Date.now(),
) {
  const data = validatePackage(input);
  // Only remove the untouched, built-in placeholders; retain the user's own edits.
  const tasks = existing.tasks.filter(
    (t) =>
      !(
        t.id === "ornek-gorev" &&
        t.title === "Haftalık antrenman planını hazırla" &&
        t.note ===
          "Bu kayıt örnektir. Gerçek ekip verileriyle bağlantısı yoktur." &&
        !t.done
      ),
  );
  const trainers = existing.trainers.filter(
    (t) =>
      !(
        t.id === "ornek-2" &&
        t.name === "Eğitmen" &&
        !tasks.some((task) => task.trainerId === t.id)
      ),
  );
  const mapping = new Map<string, string>();
  for (const row of data.trainers) {
    let trainer = trainers.find(
      (t) =>
        t.name.trim().toLocaleLowerCase("tr") ===
        row.name.trim().toLocaleLowerCase("tr"),
    );
    if (!trainer) {
      const id = trainers.some((t) => t.id === row.id)
        ? `import-${row.id}-${now}`
        : row.id;
      trainer = {
        id,
        name: row.name.trim(),
        order: Math.max(0, ...trainers.map((t) => t.order)) + 1,
        createdAt: now,
      };
      trainers.push(trainer);
    }
    mapping.set(row.id, trainer.id);
  }
  let added = 0;
  for (const row of data.tasks) {
    if (tasks.some((t) => t.id === row.id)) continue;
    tasks.push({
      id: row.id,
      title: row.title.trim(),
      trainerId: mapping.get(row.trainerId)!,
      priority: row.priority,
      due: row.due,
      note: row.note,
      done: false,
      doneAt: null,
      createdAt: now + added,
      updatedAt: now,
    });
    added++;
  }
  return { trainers, tasks, added };
}
export async function decryptPackage(
  bytes: Uint8Array<ArrayBuffer>,
  encodedKey: string,
): Promise<TaskPackage> {
  if (
    !/^[A-Za-z0-9_-]{43}$/.test(encodedKey) ||
    bytes.length < 29 ||
    bytes.length > 2_000_000
  )
    throw new Error("Görev yükleme bağlantısı geçersiz.");
  const raw = Uint8Array.from(
    atob(encodedKey.replace(/-/g, "+").replace(/_/g, "/") + "="),
    (c) => c.charCodeAt(0),
  );
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    raw.buffer,
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes.slice(0, 12) },
    key,
    bytes.slice(12),
  );
  return validatePackage(JSON.parse(new TextDecoder().decode(plain)));
}
