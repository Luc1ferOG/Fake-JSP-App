# Validation

The iOS 26 profile, sheet and conversation-row update retains Expo SDK 54, the existing lockfile/runtime dependencies, AsyncStorage and Vercel static output. Work remains local on `feature/ios-messages-simulator-v2`; no merge or deployment was performed.

Checks:

- Strict TypeScript: pass.
- ESLint: pass, no errors or warnings.
- Node regression suite: 28 pass.
- Expo static web export with one Metro worker: pass.
- Local static preview: HTTP 200.

The regression suite covers last-message selection after reorder/deletion, stable conversation sorting, localized 12/24-hour timestamps, time zones, midnight and DST boundaries, year boundaries, future messages, immutable drafts, multiple phone numbers, phone removal, rich fields, email-only contacts, validation, stable contact IDs, JSON persistence, retained conversations on contact deletion, local settings, UUIDs, legacy migration, sample contacts, and serialized/recoverable storage writes.

Supplemental Happy DOM interaction checks run the actual exported JavaScript and verify:

- No simulated clock, signal, Wi-Fi, battery or home-indicator markup.
- Clickable sorted conversation rows, current previews and timestamps.
- Info/Photos/Locations tabs and empty states.
- Only explicitly provided shared images and locations appear; hiding shared content does not delete it.
- Draft photo preview, X/Escape cancellation and no premature saved-data mutation.
- Multiple labeled phones and all requested Add actions, notes and tone selectors.
- Invalid fields prevent saving.
- Simulated quota failures leave the editor open and preserve saved contact data; retry succeeds.
- Saving updates profile/header/list and restores after storage rehydration.
- Local contacts, persistent toggles, block/unblock behavior and suppressed incoming messages.
- Contact deletion requires confirmation and retains every message and the thread ID.

Happy DOM is installed only in the ignored `.qa` directory. Its window reload resets storage, so the harness explicitly transfers saved storage to test rehydration. These are DOM behavior checks, not real-browser layout or physical-device tests.

## Visual review limits

The four reference screenshot images were not available in the conversation or repository. Layout follows the written screen specification, including shared glass tokens, subtle green ambient layers, rounded cards, editor ordering, safe areas and a fixed navigation layer over independently scrollable sheet contents. CSS fallback, selector ordering and mobile field widths were reviewed. Exact pixel comparison cannot be claimed.

Launching Chrome for real-browser screenshots was rejected by automatic approval review because sandbox approval is disabled. No alternative browser launch was attempted after that rejection. Real-browser screenshots and physical iPhone keyboard/safe-area checks remain unverified.

## Reproduce

Use Node 22.18+ or 24 (development used 24.21.0):

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build:web
node scripts/serve-preview.cjs
```

This environment required `npm ci --ignore-scripts` because lifecycle subprocesses are restricted. Metro uses one worker. Existing outdated browser-dataset notices and Node's TypeScript module-detection notice are non-failing; dependencies were not upgraded to suppress them.

## Personal persistence — 2026-11-03

The website saves each browser profile's library under the existing `messages_simulator_v2` key. Existing visitors retain their data; there is no login or cross-device sync. Different people using the same browser profile share that profile's data.

Validation completed for this change:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: all 31 tests passed, including concurrent contact/message changes, failure recovery, added chats and draft restoration.
- `npm run build:web`: passed; Expo exported four static routes.
- Happy DOM interaction check against the production export (`node .qa/persistence.mjs`): created a personal chat, saved and restored an unsent draft, sent the message and verified draft clearing, renamed the contact, reloaded and verified the saved name and message, switched back to another chat and restored its separate draft, and opened an independent browser context with none of the first visitor's additions. No runtime console errors were recorded.
- `git diff --check`: passed.

Happy DOM provides simulated DOM verification. Physical device behavior and real-browser visual checks were not exercised in this change. Contact editor drafts remain explicit-save: the checkmark commits edits and Cancel discards them.
