import { getApp } from "@react-native-firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  reauthenticateWithCredential,
  revokeToken,
} from "@react-native-firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocsFromServer,
  query,
  where,
  writeBatch,
} from "@react-native-firebase/firestore";
import { getFunctions, httpsCallable } from "@react-native-firebase/functions";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import * as Apple from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { getState, setState, clearSession } from "./store";
import { canEdit, canRead } from "../domain/model";
import type { Task, Trainer } from "../domain/model";
import { reportError } from "./service";
const app = getApp(),
  auth = getAuth(app),
  db = getFirestore(app);
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: false,
});
export function start() {
  let userOff: () => void = () => {},
    dataOff: (() => void)[] = [],
    session = 0;
  const stopData = () => {
    userOff();
    dataOff.forEach((f) => f());
    dataOff = [];
  };
  const authOff = onAuthStateChanged(auth, (user) => {
    stopData();
    session++;
    const current = session;
    clearSession();
    setState({ ready: true });
    if (!user) return;
    setState({
      user: {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        verified: user.emailVerified,
      },
    });
    userOff = onSnapshot(
      doc(db, "config", "access"),
      (snap) => {
        if (current !== session) return;
        const access = snap.data() || {},
          editors = access.editors || [],
          viewers = access.viewers || [];
        const allowed = canRead(
          user.email,
          user.emailVerified,
          editors,
          viewers,
        );
        setState({
          allowed,
          accessReady: true,
          editor: canEdit(user.email, user.emailVerified, editors),
        });
        if (!allowed) {
          dataOff.forEach((f) => f());
          dataOff = [];
          setState({ tasks: [], trainers: [], loaded: false });
          return;
        }
        if (dataOff.length) return;
        const loaded = { trainers: false, tasks: false },
          pending = { trainers: false, tasks: false },
          cached = { trainers: true, tasks: true };
        for (const name of ["trainers", "tasks"] as const)
          dataOff.push(
            onSnapshot(
              collection(db, name),
              { includeMetadataChanges: true },
              (data) => {
                if (current !== session) return;
                const rows = data.docs.map((d) => ({ ...d.data(), id: d.id }));
                loaded[name] = true;
                pending[name] = data.metadata.hasPendingWrites;
                cached[name] = data.metadata.fromCache;
                setState({
                  [name]:
                    name === "trainers"
                      ? (rows as Trainer[]).sort((a, b) => a.order - b.order)
                      : rows,
                  loaded: loaded.tasks && loaded.trainers,
                  pending: pending.tasks || pending.trainers,
                  cached: cached.tasks || cached.trainers,
                });
              },
              reportError,
            ),
          );
      },
      (error) => {
        if (current !== session) return;
        stopData();
        setState({
          allowed: false,
          editor: false,
          accessReady: true,
          tasks: [],
          trainers: [],
          loaded: false,
        });
        if (
          !String((error as { code?: string }).code).includes(
            "permission-denied",
          )
        )
          reportError(error);
      },
    );
  });
  return () => {
    session++;
    authOff();
    stopData();
  };
}
async function googleCredential() {
  if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
    throw new Error(
      "Google giriş ayarı eksik. Web OAuth istemci kimliğini ekleyip yeniden derleyin.",
    );
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result))
    throw Object.assign(new Error("Giriş iptal edildi."), {
      code: "cancelled",
    });
  if (!result.data.idToken)
    throw new Error("Google kimliği alınamadı. Yeniden dene.");
  return {
    credential: GoogleAuthProvider.credential(result.data.idToken),
    authorizationCode: null,
  };
}
async function appleCredential() {
  if (Platform.OS !== "ios")
    throw new Error("Apple ile giriş iOS uygulamasında kullanılabilir.");
  const rawNonce = Crypto.randomUUID();
  const nonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  const result = await Apple.signInAsync({
    requestedScopes: [
      Apple.AppleAuthenticationScope.FULL_NAME,
      Apple.AppleAuthenticationScope.EMAIL,
    ],
    nonce,
  });
  if (!result.identityToken)
    throw new Error("Apple kimliği alınamadı. Yeniden dene.");
  return {
    credential: new OAuthProvider("apple.com").credential({
      idToken: result.identityToken,
      rawNonce,
      fullName: result.fullName || undefined,
    }),
    authorizationCode: result.authorizationCode,
  };
}
export async function login(provider: "google" | "apple") {
  const { credential } = await (provider === "apple"
    ? appleCredential()
    : googleCredential());
  await signInWithCredential(auth, credential);
}
export async function logout() {
  await signOut(auth);
  try {
    await GoogleSignin.signOut();
  } catch {
    /* No Google session when signed in with Apple. */
  }
}
export function addTrainer(name: string) {
  return addDoc(collection(db, "trainers"), {
    name,
    order: Math.max(0, ...getState().trainers.map((t) => t.order)) + 1,
    createdAt: Date.now(),
  });
}
export function renameTrainer(id: string, name: string) {
  return updateDoc(doc(db, "trainers", id), { name });
}
export async function removeTrainer(id: string) {
  const ref = doc(db, "trainers", id);
  await updateDoc(ref, { deleting: true });
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
export function addTask(title: string, trainerId: string) {
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
export function patchTask(id: string, patch: Partial<Task>) {
  return updateDoc(doc(db, "tasks", id), { ...patch, updatedAt: Date.now() });
}
export function removeTask(id: string) {
  return deleteDoc(doc(db, "tasks", id));
}
export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) return;
  const provider = user.providerData.some((p) => p.providerId === "apple.com")
    ? "apple"
    : "google";
  const { credential, authorizationCode } = await (provider === "apple"
    ? appleCredential()
    : googleCredential());
  await reauthenticateWithCredential(user, credential);
  await user.getIdToken(true);
  if (provider === "apple" && authorizationCode)
    await revokeToken(auth, authorizationCode);
  await httpsCallable(
    getFunctions(
      app,
      process.env.EXPO_PUBLIC_FUNCTIONS_REGION || "europe-west1",
    ),
    "deleteMyAccount",
  )({});
  await logout();
}
