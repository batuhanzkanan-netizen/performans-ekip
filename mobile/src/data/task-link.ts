import { decryptPackage } from "../domain/task-import";
// This runs only in the browser preview. The key stays in the URL fragment and
// is never sent with the file request or committed alongside the encrypted file.
export async function loadTaskLink(): Promise<boolean> {
  const fragment = globalThis.location.hash;
  if (!fragment.startsWith("#pa-load=")) return false;
  const match = /^#pa-load=([a-f0-9-]{36})\.([A-Za-z0-9_-]{43})$/.exec(
    fragment,
  );
  if (!match)
    throw new Error(
      "Görev yükleme bağlantısı eksik. Sana verilen bağlantıyı yeniden aç.",
    );
  const base = process.env.EXPO_BASE_URL || "";
  const response = await fetch(`${base}/private-previews/${match[1]}.bin`, {
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok)
    throw new Error(
      "Görev listesi yüklenemedi. İnternetini kontrol edip bağlantıyı yeniden aç.",
    );
  const data = await decryptPackage(
    new Uint8Array(await response.arrayBuffer()),
    match[2],
  );
  await (await import("./demo")).importTasks(data);
  globalThis.history.replaceState(
    globalThis.history.state,
    "",
    globalThis.location.pathname + globalThis.location.search,
  );
  return true;
}
