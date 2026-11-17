import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canEdit,
  canRead,
  selectTasks,
  validDate,
  firstLink,
} from "../src/domain/model";
import type { Task } from "../src/domain/model";
const base: Task = {
  id: "a",
  title: "Test",
  trainerId: "x",
  priority: 1,
  due: null,
  done: false,
  doneAt: null,
  note: "",
  createdAt: 1,
  updatedAt: 1,
};
test("Ekip dışı hesap ve doğrulanmamış e-posta erişemez", () => {
  assert.equal(
    canRead(
      "stranger@example.com",
      true,
      ["editor@example.com"],
      ["viewer@example.com"],
    ),
    false,
  );
  assert.equal(
    canRead("viewer@example.com", false, [], ["viewer@example.com"]),
    false,
  );
  assert.equal(
    canRead("viewer@example.com", true, [], ["viewer@example.com"]),
    true,
  );
  assert.equal(
    canEdit("viewer@example.com", true, ["editor@example.com"]),
    false,
  );
});
test("Tamamlananlar önem sıralamasında da alttadır", () => {
  const tasks = [
    base,
    { ...base, id: "b", priority: 3 as const, done: true },
    { ...base, id: "c", priority: 2 as const },
  ];
  assert.deepEqual(
    selectTasks(tasks, "all", "priority").map((t) => t.id),
    ["c", "a", "b"],
  );
});
test("Takvim geçersiz günleri reddeder ve linkler güvenlidir", () => {
  assert.equal(validDate("2027-02-30"), false);
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(firstLink("javascript:alert(1)"), null);
  assert.equal(firstLink("https://example.com"), "https://example.com/");
});
