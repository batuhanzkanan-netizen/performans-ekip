import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocsFromServer,
  query,
  where,
} from "firebase/firestore";
import { state } from "./state";
const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
export const configured = Object.values(config).every(Boolean);
let auth,
  db,
  unsubs = [];
export function message(error) {
  return (
    {
      "permission-denied":
        "Bu işlem için yetkin yok. Yöneticiyle iletişime geç.",
      "resource-exhausted":
        "Veri kotası doldu. Firebase kotasını kontrol edin.",
      unavailable:
        "Bağlantı kurulamadı. İnternetini kontrol et; kayıtlar bağlantı gelince eşitlenir.",
      "auth/popup-blocked":
        "Giriş penceresi engellendi. Tarayıcıda açılır pencerelere izin ver.",
      "auth/popup-closed-by-user": "Giriş tamamlanmadı. Yeniden giriş yap.",
      "auth/unauthorized-domain":
        "Bu alan adı yetkili değil. Firebase Auth alan adlarına ekleyin.",
      "auth/network-request-failed":
        "Giriş için internet bağlantını kontrol et.",
      "failed-precondition":
        "Yerel önbellek açılamadı. Tarayıcını güncelleyip yeniden aç.",
    }[error.code] || "İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene."
  );
}
export function connect(changed) {
  if (!configured) {
    state.authReady = true;
    changed();
    return;
  }
  try {
    const app = initializeApp(config);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    state.configured = true;
    onAuthStateChanged(auth, (user) => {
      unsubs.forEach((f) => f());
      unsubs = [];
      let dataUnsubs = [];
      Object.assign(state, {
        user,
        authReady: true,
        editor: false,
        accessReady: false,
        accessDenied: false,
        trainers: [],
        tasks: [],
        loaded: { trainers: false, tasks: false },
        cached: { trainers: true, tasks: true },
        pending: { trainers: false, tasks: false },
        error: "",
      });
      changed(true);
      if (!user) return;
      const fail = (e) => {
        state.error = message(e);
        changed();
      };
      const stopData = () => {
        dataUnsubs.forEach((f) => f());
        dataUnsubs = [];
      };
      unsubs.push(stopData);
      unsubs.push(
        onSnapshot(
          doc(db, "config", "access"),
          (snap) => {
            const access = snap.data() || {},
              wasEditor = state.editor;
            state.editor =
              !!user.emailVerified && !!access.editors?.includes(user.email);
            state.accessReady = true;
            state.accessDenied =
              !user.emailVerified ||
              !(access.editors || [])
                .concat(access.viewers || [])
                .includes(user.email);
            if (state.accessDenied) {
              stopData();
              state.tasks = [];
              state.trainers = [];
              changed(true);
              return;
            }
            changed(wasEditor && !state.editor);
            if (dataUnsubs.length) return;
            for (const name of ["trainers", "tasks"])
              dataUnsubs.push(
                onSnapshot(
                  collection(db, name),
                  { includeMetadataChanges: true },
                  (snap) => {
                    state[name] = snap.docs.map((d) => ({
                      ...d.data(),
                      id: d.id,
                    }));
                    if (name === "trainers")
                      state.trainers.sort(
                        (a, b) =>
                          a.order - b.order ||
                          a.name.localeCompare(b.name, "tr"),
                      );
                    state.loaded[name] = true;
                    state.cached[name] = snap.metadata.fromCache;
                    state.pending[name] = snap.metadata.hasPendingWrites;
                    changed();
                  },
                  fail,
                ),
              );
          },
          (e) => {
            stopData();
            state.accessReady = true;
            state.accessDenied = true;
            state.editor = false;
            state.tasks = [];
            state.trainers = [];
            if (e.code !== "permission-denied") state.error = message(e);
            changed(true);
          },
        ),
      );
    });
  } catch (e) {
    state.authReady = true;
    state.error = message(e);
    changed();
  }
}
export const login = () => signInWithPopup(auth, new GoogleAuthProvider());
export const logout = () => signOut(auth);
const requireEditor = () => {
  if (!state.editor)
    throw Object.assign(new Error("Yetki yok"), { code: "permission-denied" });
};
export function addTrainer(name) {
  requireEditor();
  return addDoc(collection(db, "trainers"), {
    name,
    order: Math.max(0, ...state.trainers.map((t) => t.order)) + 1,
    createdAt: Date.now(),
  });
}
export function renameTrainer(id, name) {
  requireEditor();
  return updateDoc(doc(db, "trainers", id), { name });
}
export async function removeTrainer(id) {
  requireEditor();
  if (!state.online || state.cached.tasks || state.cached.trainers)
    throw Object.assign(new Error(), { code: "unavailable" });
  const ref = doc(db, "trainers", id);
  await updateDoc(ref, { deleting: true });
  // Lock first: rules reject new tasks and transfers to this trainer during deletion.
  const tasks = await getDocsFromServer(
    query(collection(db, "tasks"), where("trainerId", "==", id)),
  );
  for (let i = 0; i < tasks.docs.length; i += 400) {
    const batch = writeBatch(db);
    tasks.docs.slice(i, i + 400).forEach((t) => batch.delete(t.ref));
    await batch.commit();
  }
  await deleteDoc(ref);
}
export function addTask(title, trainerId) {
  requireEditor();
  const now = Date.now();
  return addDoc(collection(db, "tasks"), {
    title,
    trainerId,
    priority: 2,
    due: null,
    done: false,
    doneAt: null,
    note: "",
    createdAt: now,
    updatedAt: now,
  });
}
export function patchTask(id, patch) {
  requireEditor();
  return updateDoc(doc(db, "tasks", id), { ...patch, updatedAt: Date.now() });
}
export function removeTask(id) {
  requireEditor();
  return deleteDoc(doc(db, "tasks", id));
}
