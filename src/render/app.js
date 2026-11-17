const navIcon = (id) =>
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  {
    tasks:
      '<path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2M10 6h11M10 12h11M10 18h11"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2"/>',
    team: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-15a3 3 0 0 1 0 6m3 9v-3a6 6 0 0 0-2-4"/>',
    settings:
      '<path d="m9 3-.5 3-2 .9L4 6l-2 4 2.5 2v2L2 16l2 4 2.5-.9 2 .9.5 3h6l.5-3 2-.9 2.5.9 2-4-2.5-2v-2l2.5-2-2-4-2.5.9-2-.9L15 3Z"/><circle cx="12" cy="13" r="3"/>',
  }[id] +
  "</svg>";
import {
  state,
  escapeHTML as e,
  overdue,
  visibleTasks,
  priorities,
} from "../state.js";
import { taskRow, trainerOptions } from "./tasks.js";
export function status() {
  if (!state.online) return "Çevrimdışı";
  if (Object.values(state.pending).some(Boolean)) return "Kaydediliyor…";
  if (
    !Object.values(state.loaded).every(Boolean) ||
    Object.values(state.cached).some(Boolean)
  )
    return "Bağlanıyor…";
  return "Tüm değişiklikler kaydedildi · canlı";
}
export function shell() {
  const s = state;
  if (!s.authReady)
    return '<main class="login"><div class="logo">PA</div><p>Bağlanıyor…</p></main>';
  if (!s.user)
    return `<main class="login"><div class="logo">PA</div><p class="brand">PERFORMANS ACADEMY</p><h1>Ekip Görev Takibi</h1><p class="muted">Ekibin aynı sayfada, görevlerin yolunda.</p>${s.error ? `<div class="banner" role="alert">${e(s.error)}</div>` : ""}${s.configured ? '<button class="google" data-action="login"><span aria-hidden="true">G</span> Google ile giriş yap</button>' : '<div class="banner">Firebase ayarları eksik. README adımlarını tamamlayıp uygulamayı yeniden yayınlayın.</div>'}<small>Performans Academy · Ekip çalışma alanı</small></main>`;
  if (s.accessDenied)
    return `<main class="login"><div class="logo">PA</div><h1>Ekip erişimi bekleniyor</h1><div class="banner">${e(s.user.email)} ekip listesinde görünmüyor. Ekip yöneticisinden bu adresi eklemesini iste.</div><button data-action="logout" class="primary">Çıkış yap</button></main>`;
  const trainer = s.trainers.find((t) => t.id === s.tab),
    title = s.tab === "all" ? "Genel Bakış" : trainer?.name || "Genel Bakış";
  const all = s.tasks.filter((t) => s.tab === "all" || t.trainerId === s.tab),
    tasks = visibleTasks();
  return `<div class="workspace"><header><div><p class="brand">PERFORMANS ACADEMY</p><h1>Ekip Görev Takibi</h1></div><div class="account"><span class="avatar" title="${e(s.user.email)}">${e((s.user.displayName || s.user.email || "P")[0])}</span><button data-action="logout" class="text-button">Çıkış</button></div><p class="sync ${!s.online ? "offline" : ""}" role="status"><i></i>${status()}</p></header>${s.error ? `<div class="banner" role="alert">${e(s.error)} <button data-action="dismiss">Kapat</button></div>` : ""}${!s.online ? '<div class="banner">Çevrimdışısın. Son veriler gösteriliyor; değişiklikler bağlantı gelince kaydedilir.</div>' : ""}${s.accessReady && !s.editor ? '<div class="banner">Yalnız görüntüleme · Düzenleme yetkisi için yöneticiyle iletişime geç.</div>' : ""}<nav class="tabs" aria-label="Eğitmen sekmeleri">${[{ id: "all", name: "Genel Bakış" }, ...s.trainers].map((t) => `<div class="tab-wrap ${s.tab === t.id ? "active" : ""}"><button class="tab" data-tab="${e(t.id)}" ${s.tab === t.id ? 'aria-current="page"' : ""}>${e(t.name)}<span class="badge">${s.tasks.filter((x) => !x.done && (t.id === "all" || x.trainerId === t.id)).length}</span></button>${s.editor && s.tab === t.id && t.id !== "all" ? `<button class="edit-tab icon-button" data-action="edit-trainer" aria-label="Eğitmeni düzenle">✎</button>` : ""}</div>`).join("")}${s.editor ? '<button class="add-trainer icon-button" data-action="add-trainer" aria-label="Eğitmen ekle">+</button>' : ""}</nav><main><section class="view-head"><div><p class="eyebrow">EKİP ÇALIŞMA ALANI</p><h2>${e(title)}</h2><p class="counts">${all.filter((t) => !t.done).length} açık <span>·</span> ${all.filter((t) => t.done).length} tamamlandı <span>·</span> ${all.filter(overdue).length} gecikmiş</p></div><label class="sort">Sıralama<select id="sort"><option value="added" ${s.sort === "added" ? "selected" : ""}>Eklenme</option><option value="priority" ${s.sort === "priority" ? "selected" : ""}>Önem</option><option value="due" ${s.sort === "due" ? "selected" : ""}>Tarih</option></select></label></section>${
    s.tab === "all"
      ? `<div class="filters"><label>Eğitmen<select id="trainer-filter"><option value="all">Tüm eğitmenler</option>${trainerOptions(s.trainerFilter)}</select></label><label>Önem<select id="priority-filter"><option value="all">Tüm önemler</option>${Object.entries(
          priorities,
        )
          .map(
            ([v, l]) =>
              `<option value="${v}" ${s.priorityFilter === v ? "selected" : ""}>${l}</option>`,
          )
          .join(
            "",
          )}</select></label><span class="result-count">${tasks.length} görev</span></div>`
      : ""
  }<section class="task-list" aria-label="Görevler"><div class="table-head"><span>GÖREV</span><span>ETİKETLER VE TARİH</span><span>NOT</span></div>${!Object.values(s.loaded).every(Boolean) ? '<p class="empty">Görevler yükleniyor…</p>' : !s.trainers.length ? '<div class="empty"><span class="empty-symbol">+</span><h3>Ekibini bir araya getir</h3><p>Üstteki + ile ilk eğitmeni ekle</p></div>' : !tasks.length ? '<p class="empty">Bu filtrelere uyan görev yok</p>' : tasks.map(taskRow).join("")}</section>${s.editor && s.trainers.length ? `<form id="new-task" class="new-task"><span aria-hidden="true">+</span><input name="title" aria-label="Yeni görev başlığı" placeholder="Yeni görev · yaz ve Enter’a bas" maxlength="199" required autocomplete="off">${s.tab === "all" ? `<select name="trainer" aria-label="Yeni görevin eğitmeni">${trainerOptions(s.trainerFilter === "all" ? "" : s.trainerFilter)}</select>` : ""}<button type="submit" class="primary">Ekle</button></form>` : ""}<footer class="page-footer">Birlikte planla. Birlikte ilerle.<span>PERFORMANS ACADEMY</span></footer></main></div><nav class="bottom-nav" aria-label="Ana navigasyon">${[
    ["tasks", "Görevler", "☷"],
    ["calendar", "Takvim", "▦"],
    ["team", "Ekip", "♧"],
    ["settings", "Ayarlar", "⚙"],
  ]
    .map(
      ([id, name, icon]) =>
        `<button data-nav="${id}" data-name="${name}" class="${id === "tasks" ? "selected" : ""}" ${id === "tasks" ? 'aria-current="page"' : ""}><span aria-hidden="true">${navIcon(id)}</span>${name}</button>`,
    )
    .join("")}</nav>`;
}
