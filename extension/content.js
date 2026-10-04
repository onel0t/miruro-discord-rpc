// Runs on every page + iframe; only activates on Miruro-style domains (top frame)
// or inside iframes of a tab whose top frame is Miruro (video players are often iframes).
const isTop = window === window.top;
const onMiruro = /(^|\.)miruro\./i.test(location.hostname);
if (isTop && !onMiruro) throw new Error("not miruro"); // stop script on other sites

const send = (m) => { try { chrome.runtime.sendMessage(m); } catch (e) {} };

function videoState() {
  const v = document.querySelector("video");
  if (!v || !isFinite(v.duration) || v.duration <= 0) return null;
  return { paused: v.paused, currentTime: v.currentTime, duration: v.duration };
}

function pageInfo() {
  const url = new URL(location.href);
  if (!/^\/watch\//i.test(url.pathname)) return null; // only on /watch/ pages
  const title = document.title
    .replace(/^watch\s+/i, "")
    .replace(/\s*[·|–-]\s*miruro.*$/i, "")
    .trim() || document.querySelector("h1.anime-title")?.textContent?.trim();
  if (!title) return null;
  const ep = url.searchParams.get("ep");
  // episode name, e.g. "EP 1: The Day a New Demon Was Born"
  const active = document.querySelector('[data-episode-number="' + ep + '"]');
  const epName = (active?.getAttribute("title") || "").replace(/^EP\s*\d+:\s*/i, "") || null;
  const coverEl = document.querySelector('img[class*="coverImg"]');
  let cover = coverEl?.src || null;
  if (cover && !/^https?:/i.test(cover)) cover = null;
  return { title, episode: ep, epName, cover, url: location.href };
}

setInterval(() => {
  if (isTop) send({ kind: "page", info: pageInfo(), video: videoState() });
  else { const v = videoState(); if (v) send({ kind: "video", video: v }); }
}, 3000);
