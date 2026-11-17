import AsyncStorage from "@react-native-async-storage/async-storage";
import { getState, setState, clearSession } from "./store";
import { localDate } from "../domain/model";
import type { Task, Trainer } from "../domain/model";
const key = "pa-demo-v1";
let sequence = Promise.resolve();
const persist = () => {
  const { tasks, trainers } = getState();
  sequence = sequence.then(() =>
    AsyncStorage.setItem(key, JSON.stringify({ tasks, trainers })),
  );
  return sequence;
};
export async function login() {
  let data;
  const raw = await AsyncStorage.getItem(key);
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {}
  }
  const now = Date.now();
  const trainers: Trainer[] = [
    { id: "ornek-1", name: "Batuhan", order: 1, createdAt: now },
    { id: "ornek-2", name: "Eğitmen", order: 2, createdAt: now },
  ];
  const tasks: Task[] = [
    {
      id: "ornek-gorev",
      trainerId: "ornek-1",
      title: "Haftalık antrenman planını hazırla",
      priority: 3,
      due: localDate(),
      done: false,
      doneAt: null,
      note: "Bu kayıt örnektir. Gerçek ekip verileriyle bağlantısı yoktur.",
      createdAt: now,
      updatedAt: now,
    },
  ];
  setState({
    demo: true,
    ready: true,
    user: {
      uid: "demo",
      email: "demo@example.com",
      name: "Önizleme",
      verified: true,
    },
    allowed: true,
    editor: true,
    accessReady: true,
    loaded: true,
    cached: false,
    tasks: data?.tasks ?? tasks,
    trainers: data?.trainers ?? trainers,
  });
}
export async function logout() {
  clearSession();
  setState({ demo: false, ready: true });
}
export async function addTrainer(name: string) {
  const now = Date.now();
  setState({
    trainers: [
      ...getState().trainers,
      { id: `demo-${now}`, name, order: now, createdAt: now },
    ],
  });
  await persist();
}
export async function renameTrainer(id: string, name: string) {
  setState({
    trainers: getState().trainers.map((t) =>
      t.id === id ? { ...t, name } : t,
    ),
  });
  await persist();
}
export async function removeTrainer(id: string) {
  setState({
    trainers: getState().trainers.filter((t) => t.id !== id),
    tasks: getState().tasks.filter((t) => t.trainerId !== id),
  });
  await persist();
}
export async function addTask(title: string, trainerId: string) {
  const now = Date.now();
  const task: Task = {
    id: `demo-${now}-${Math.random().toString(36).slice(2)}`,
    title,
    trainerId,
    priority: 2,
    due: null,
    done: false,
    doneAt: null,
    note: "",
    createdAt: now,
    updatedAt: now,
  };
  setState({ tasks: [...getState().tasks, task] });
  await persist();
}
export async function patchTask(id: string, patch: Partial<Task>) {
  setState({
    tasks: getState().tasks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t,
    ),
  });
  await persist();
}
export async function removeTask(id: string) {
  setState({ tasks: getState().tasks.filter((t) => t.id !== id) });
  await persist();
}
export async function deleteAccount() {
  await AsyncStorage.removeItem(key);
  await logout();
}
