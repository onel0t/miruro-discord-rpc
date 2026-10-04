# Miruro Discord Presence

Shows the anime you're watching on [Miruro](https://www.miruro.to) as your Discord status: title, episode, cover art, a progress timer, and a small play/pause icon.

It has two parts, because browsers can't talk to the Discord app directly:

- `extension/` reads what you're watching from the Miruro page.
- `helper/` is a small local Node app that sets your status through Discord's official Rich Presence connection.

It never touches your Discord token, and nothing leaves your computer except the status Discord itself shows.

## Setup

**Requirements:** Node.js, the Discord **desktop** app (the web version can't do Rich Presence), and a Chromium browser (Chrome, Brave, Edge) or Firefox.

1. Create an app at https://discord.com/developers/applications (New Application). Name it `Miruro`; the name shows up as "Watching Miruro". Copy its **Application ID**.
2. Run the helper:
   - Windows: double-click `helper/start.bat`
   - Mac/Linux: `sh helper/start.sh`

   It asks for the Application ID once and remembers it. Wait for `Connected to Discord`.
3. Load the extension:
   - Chrome/Brave/Edge: `chrome://extensions` (or `brave://extensions`) -> Developer mode -> **Load unpacked** -> pick the `extension` folder.
   - Firefox: `about:debugging` -> This Firefox -> Load Temporary Add-on -> pick `extension/manifest.json`.
4. Open an episode on Miruro and refresh the page. Pin the extension to see its status badge.
5. In Discord: Settings -> Activity Privacy -> turn on "Share your detected activity".

## Troubleshooting

The extension icon badge tells you what's happening:

| Badge | Meaning |
|-------|---------|
| ON (green) | Sending to the helper, all good |
| ERR (red) | Can't reach the helper. Is it running? |
| M (grey) | On Miruro, but not on a `/watch/` page |
| none | Extension isn't running on this page. Refresh it |

Open http://127.0.0.1:6969 to see the helper's status and the last data it received.

## Customizing

- Play/pause icons: change `PLAY_ICON` / `PAUSE_ICON` at the top of `helper/server.js`.
- Other Miruro domains: add them to `manifest.json` (`host_permissions`) and the regex in `extension/content.js`.
- Wrong title or episode? Adjust `pageInfo()` in `extension/content.js`.

- Disclaimer: This is an unofficial, fan-made project. I'm not affiliated with, endorsed by, or connected to **Discord** or **Miruro** in any way. I made it for my own enjoyment and hope others find it useful too.

## License

MIT
