import "firebase/compat/firestore";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFile } from "node:fs/promises";
import { before, after, test } from "node:test";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-pa-ekip",
    firestore: {
      rules: await readFile(
        new URL("../firestore.rules", import.meta.url),
        "utf8",
      ),
    },
  });
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, "config/access"), {
      editors: ["editor@example.com"],
      viewers: ["viewer@example.com"],
    });
    await setDoc(doc(db, "trainers/t1"), {
      name: "Test",
      order: 1,
      createdAt: 1,
    });
    await setDoc(doc(db, "tasks/task1"), task("Test"));
  });
});
after(async () => {
  await env?.cleanup();
});
const task = (title) => ({
  title,
  trainerId: "t1",
  priority: 2,
  due: null,
  done: false,
  doneAt: null,
  note: "",
  createdAt: 1,
  updatedAt: 1,
});
const db = (email, verified = true) =>
  env
    .authenticatedContext(email, { email, email_verified: verified })
    .firestore();
test("Giriş yapmayanlar ve ekip dışı hesaplar veri veya e-posta listesini okuyamaz", async () => {
  await assertFails(
    getDocs(collection(env.unauthenticatedContext().firestore(), "tasks")),
  );
  await assertFails(getDocs(collection(db("stranger@example.com"), "tasks")));
  await assertFails(getDoc(doc(db("stranger@example.com"), "config/access")));
  await assertFails(
    getDoc(doc(db("editor@example.com", false), "tasks/task1")),
  );
});
test("İzleyici okur, görev veya eğitmen değiştiremez", async () => {
  const store = db("viewer@example.com");
  await assertSucceeds(getDocs(collection(store, "tasks")));
  await assertFails(updateDoc(doc(store, "tasks/task1"), { title: "No" }));
  await assertFails(
    setDoc(doc(store, "trainers/viewer"), {
      name: "Test",
      order: 1,
      createdAt: 1,
    }),
  );
});
test("Editör geçerli görev ekler; şema ve önem sınırları uygulanır", async () => {
  const store = db("editor@example.com");
  await assertSucceeds(setDoc(doc(store, "tasks/valid"), task("Geçerli")));
  for (const [id, data] of Object.entries({
    number: task(3),
    long: task("a".repeat(200)),
    empty: task(""),
    priority0: { ...task("P"), priority: 0 },
    priority4: { ...task("P"), priority: 4 },
    decimal: { ...task("P"), priority: 1.5 },
    orphan: { ...task("P"), trainerId: "missing" },
    extra: { ...task("P"), admin: true },
  }))
    await assertFails(setDoc(doc(store, "tasks/" + id), data));
});
test("Editör erişim listesini uygulamadan değiştiremez", async () => {
  await assertFails(
    updateDoc(doc(db("editor@example.com"), "config/access"), {
      viewers: ["stranger@example.com"],
    }),
  );
});
test("Silme kilidi yeni görev ve aktarımı engeller", async () => {
  const store = db("editor@example.com");
  await assertSucceeds(
    updateDoc(doc(store, "trainers/t1"), { deleting: true }),
  );
  await assertFails(setDoc(doc(store, "tasks/locked"), task("Kilitli")));
  await assertFails(updateDoc(doc(store, "tasks/task1"), { title: "Kilitli" }));
});
