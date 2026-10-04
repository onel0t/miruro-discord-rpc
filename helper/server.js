// Receives updates from the browser extension and sets Discord Rich Presence.
// Setup: create an app at https://discord.com/developers/applications,
// name it e.g. "Miruro" (this name shows as "Watching Miruro"), copy the Application ID,
// then run:  CLIENT_ID=123456789 node server.js
const http = require("http");
const RPC = require("discord-rpc");

const CLIENT_ID = (process.env.CLIENT_ID || "").replace(/[^0-9]/g, "");
console.log("Using Application ID:", JSON.stringify(CLIENT_ID), "(" + CLIENT_ID.length + " digits)");
if (!/^\d{17,20}$/.test(CLIENT_ID)) console.log("!! That doesn't look like a valid Application ID. Delete clientid.txt and run start.bat again.");
const PORT = 6969;
// Small play/pause icons. Public image URLs work, so no Discord upload is needed.
// (Twemoji ▶ and ⏸. Swap in your own image URLs here if you like.)
const PLAY_ICON = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/25b6.png";
const PAUSE_ICON = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/23f8.png";
const STALE_MS = 15000;

let rpc = null, ready = false, last = null, sent = null, lastSent = 0, lastUpdate = 0, retry = null;

function connect() {
  clearTimeout(retry);
  ready = false;
  rpc = new RPC.Client({ transport: "ipc" });
  rpc.on("ready", () => { ready = true; console.log("Connected to Discord as", rpc.user && rpc.user.username); });
  rpc.transport.once("close", () => { if (ready) console.log("Discord closed the connection."); ready = false; retry = setTimeout(connect, 10000); });
  rpc.login({ clientId: CLIENT_ID }).catch((e) => {
    console.log("Could not connect to Discord:", e && e.message ? e.message : e, "- retrying in 10s...");
    try { rpc.destroy(); } catch (_) {}
    retry = setTimeout(connect, 10000);
  });
}

function changed(a, b) {
  if (!a || !b) return true;
  if (a.title !== b.title || a.episode !== b.episode) return true;
  const ap = a.video?.paused, bp = b.video?.paused;
  if (ap !== bp) return true;
  if (a.video && b.video && !b.video.paused) {
    const expected = a.video.currentTime + (Date.now() - lastSent) / 1000;
    if (Math.abs(expected - b.video.currentTime) > 5) return true; // seeked
  }
  return false;
}

async function setPresence(d) {
  if (!ready) return;
  const v = d.video;
  const activity = {
    type: 3, // Watching
    details: d.title.slice(0, 128),
    state: (d.episode ? `Ep ${d.episode}${d.epName ? ": " + d.epName : ""}` : "Watching"),
    assets: {},
    buttons: [{ label: "Watch on Miruro", url: d.url }],
    instance: false,
  };
  if (v && v.paused) activity.state = "\u23F8 " + activity.state; // ⏸ in the text too, works even if the icon fails
  activity.state = activity.state.slice(0, 128);
  if (d.cover) { activity.assets.large_image = d.cover; activity.assets.large_text = d.title.slice(0, 128); }
  if (v) { activity.assets.small_image = v.paused ? PAUSE_ICON : PLAY_ICON; activity.assets.small_text = v.paused ? "Paused" : "Playing"; }
  if (!Object.keys(activity.assets).length) delete activity.assets;
  if (v && !v.paused) {
    const now = Date.now();
    activity.timestamps = { start: Math.floor(now - v.currentTime * 1000), end: Math.floor(now + (v.duration - v.currentTime) * 1000) };
  }
  const attempts = [
    () => {},
    () => { if (activity.assets) { delete activity.assets.small_image; delete activity.assets.small_text; } },
    () => { delete activity.assets; delete activity.buttons; },
  ];
  for (const strip of attempts) {
    strip();
    try { await rpc.request("SET_ACTIVITY", { pid: process.pid, activity }); lastSent = Date.now(); console.log("Discord status updated."); return; }
    catch (e) { console.log("setActivity failed:", e && e.message ? e.message : e, "- trying simpler version"); }
  }
}

async function clear() {
  last = null; sent = null;
  try { if (ready) await rpc.request("SET_ACTIVITY", { pid: process.pid }); } catch (e) {}
}

setInterval(() => { if (last && Date.now() - lastUpdate > STALE_MS) { console.log("No updates, clearing."); clear(); } }, 5000);

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    if (req.method === "GET") { res.setHeader("Content-Type", "application/json"); return res.end(JSON.stringify({ helper: "running", discordConnected: ready, lastFromExtension: last, secondsSinceLastUpdate: lastUpdate ? Math.round((Date.now() - lastUpdate) / 1000) : null }, null, 2)); }
    try {
      if (req.url === "/presence") {
        const d = JSON.parse(body);
        if (!last || last.title !== d.title || last.episode !== d.episode) console.log("From extension:", d.title, "- Ep", d.episode, d.cover ? "(cover ok)" : "(no cover)", d.video ? "(video found)" : "(no video yet)");
        lastUpdate = Date.now();
        if (changed(sent, d) && Date.now() - lastSent > 4000) { sent = d; await setPresence(d); }
        last = d;
      } else if (req.url === "/clear") await clear();
    } catch (e) { console.log(e.message); }
    res.end("ok");
  });
}).listen(PORT, "127.0.0.1", () => console.log("Helper listening on", PORT));

connect();
