import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergePackage,
  decryptPackage,
  validatePackage,
} from "../src/domain/task-import";
import type { Task } from "../src/domain/model";
const data = {
  version: 1,
  trainers: [{ id: "trainer", name: "Deneme" }],
  tasks: [
    {
      id: "task",
      trainerId: "trainer",
      title: "Yeni görev",
      note: "Her gün 1 saat.",
      priority: 2,
      due: "2026-11-20",
    },
  ],
};
test("Tekrar yükleme mevcut değişiklikleri korur ve görevleri çoğaltmaz", () => {
  const first = mergePackage({ trainers: [], tasks: [] }, data, 1);
  const edited = {
    ...first,
    tasks: first.tasks.map((t) => ({
      ...t,
      done: true,
      doneAt: 2,
      title: "Düzenlendi",
    })),
  };
  const second = mergePackage(edited, data, 3);
  assert.equal(second.added, 0);
  assert.equal(second.trainers.length, 1);
  assert.equal(second.tasks[0].done, true);
  assert.equal(second.tasks[0].title, "Düzenlendi");
});
test("Aynı adlı mevcut eğitmen kullanılır, mevcut özel görev korunur", () => {
  const custom: Task = {
    id: "custom",
    trainerId: "my-trainer",
    title: "Özel görev",
    note: "",
    priority: 1,
    due: null,
    done: false,
    doneAt: null,
    createdAt: 1,
    updatedAt: 1,
  };
  const result = mergePackage(
    {
      trainers: [{ id: "my-trainer", name: "Deneme", order: 1, createdAt: 1 }],
      tasks: [custom],
    },
    data,
    2,
  );
  assert.equal(result.trainers.length, 1);
  assert.equal(result.tasks.length, 2);
  assert.equal(result.tasks[1].trainerId, "my-trainer");
});
test("Bozuk ve mükerrer kayıtlar mevcut veriler değişmeden reddedilir", () => {
  assert.throws(() =>
    validatePackage({ ...data, tasks: [data.tasks[0], data.tasks[0]] }),
  );
  assert.throws(() =>
    validatePackage({
      ...data,
      tasks: [{ ...data.tasks[0], due: "2026-02-30" }],
    }),
  );
});
test("Şifreli görev paketi doğru anahtarla açılır; farklı anahtar ve değiştirilmiş dosya reddedilir", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  const encoded = Buffer.from(raw).toString("base64url");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  const bytes = new Uint8Array(12 + encrypted.byteLength);
  bytes.set(iv);
  bytes.set(new Uint8Array(encrypted), 12);
  assert.deepEqual(await decryptPackage(bytes, encoded), data);
  const changed = bytes.slice();
  changed[15] ^= 1;
  await assert.rejects(decryptPackage(changed, encoded));
  await assert.rejects(
    decryptPackage(bytes, Buffer.alloc(32).toString("base64url")),
  );
});
