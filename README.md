# JSP Messages

A full-browser iPhone Messages-style simulator built with the existing Expo SDK 54 app. No real SMS messages are sent.

```sh
npm ci
npm run web
```

Use Node 22.18+ or 24. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

The conversation fills the browser window. There is no device frame, fixed iPhone size, studio sidebar, or editor toolbar.

The chat header floats over the scrolling messages. Its background uses translucent backdrop blur, circular glass controls and a separate darker name capsule; the avatar remains crisp. Browsers without backdrop-filter support use translucent gradient surfaces instead.

The main contact is **JSP_bilet**. The conversation list also includes Daniel Sion Inter, Strezo Naafiri Fucker, Stefan Kolega, Tato and Mama, with fictional Macedonian messages from both sides. Existing messages and custom pictures are preserved; the old “New contact” entry is removed during the one-time contact update.

Every contact without a custom picture uses the same flat blue-gray SVG avatar with a white head and shoulders. Open a contact’s details and choose **Edit** to open the glass editing sheet. Photo changes, names, multiple phone numbers, emails, dates, addresses, tones and notes stay in a draft until you press the checkmark. The X button discards the draft. Custom pictures survive refreshes; images that cannot load display the default silhouette.

Contact profiles include Info, Photos and Locations tabs. Empty tabs show empty states; only stored shared images or locations are displayed. Hide Alerts, Show in Shared with You and blocking are persistent local settings. Blocked contacts cannot generate incoming simulator messages. Show in Contacts opens a locally stored contact card.

Delete Contact requires confirmation and removes only the saved profile and photo. The conversation, ID and all messages remain, identified by the original phone number or “Unknown Contact.”

Conversation rows show the bottom message in timeline order and sort by that message’s timestamp. Today shows its time, yesterday uses a relative label, the previous six calendar days use weekdays, and older/future dates show a full date. Messages from a different year always include their year. Formatting uses browser locale/time zone by default; saved `preferences.locale`, `preferences.timeZone` and `preferences.hour12` override those defaults.

Press **+** to insert an incoming ticket message:

```text
Kupivte bilet za edno vozenje so cena od 40den na DD.MM.YYYY HH:mm chasot.
```

The date and time come from the moment you press the button, using your device's local timezone. The message timestamp uses that same captured moment. There is no simulated status bar or device frame.

The composer adds outgoing messages. Enter sends; Shift+Enter adds a line. Click the contact header for details or the back chevron for existing conversations. Messages remain stored locally. Existing v2 data and legacy `chat_messages` data are preserved.

Personal saving uses this site's browser storage. Each browser profile/device has its own chats, added conversations, saved contact edits and photos, contact settings, selected conversation and unsent message drafts. Return using the same browser and site address to restore them. Separate people using the same browser profile share that profile's data. Clearing site data or ending a private browsing session removes it; there is no account or cross-device sync.

From the conversation list, press the compose icon, enter a name or phone number, then choose **Create chat**. It opens only after the new conversation has been saved. Message drafts save automatically per conversation, survive reload and switching chats, and clear when sent. Contact edits still require the checkmark; Cancel discards them. The list displays save status, and failed saves show a retry action. Updates are serialized against the latest saved state so contact commits and rapid messages cannot overwrite one another. Unreadable existing data is preserved instead of replaced.

```sh
npm run typecheck
npm run lint
npm test
npm run build:web
node scripts/serve-preview.cjs
```

The static preview serves `dist` at http://127.0.0.1:8081. Vercel builds with `npm run build:web` and serves `dist`. Expo Router, existing dependency versions and static output are preserved.

The full-browser interface targets web, including mobile browsers. Native builds retain the original React Native chat screen. Exact visual comparison to the Apple reference images and physical iPhone keyboard testing remain unverified.
