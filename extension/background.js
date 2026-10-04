const HELPER = "http://127.0.0.1:6969";
const tabs = new Map(); // tabId -> { info, topVideo, frameVideo, had }

function badge(text, color) {
  chrome.action.setBadgeText({ text });
  if (color) chrome.action.setBadgeBackgroundColor({ color });
}
async function post(path, body) {
  try { await fetch(HELPER + path, { method: "POST", body: JSON.stringify(body) }); return true; }
  catch (e) { console.log("Cannot reach helper:", e.message); badge("ERR", "#d32f2f"); return false; }
}
async function push(id) {
  const t = tabs.get(id);
  if (!t) return;
  if (!t.info) {                       // on Miruro but not on a watch page
    badge("M", "#757575");
    if (t.had) { t.had = false; post("/clear", {}); }
    return;
  }
  t.had = true;
  const ok = await post("/presence", { ...t.info, video: t.topVideo || t.frameVideo || null });
  if (ok) badge("ON", "#2e7d32");
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  const id = sender.tab && sender.tab.id;
  if (id == null) return;
  const t = tabs.get(id) || {};
  if (msg.kind === "page") { t.info = msg.info; t.topVideo = msg.video; tabs.set(id, t); push(id); }
  else if (msg.kind === "video") { t.frameVideo = msg.video; tabs.set(id, t); }
});

chrome.tabs.onRemoved.addListener((id) => { if (tabs.delete(id)) post("/clear", {}); });
