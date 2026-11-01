# Repository audit

Following user feedback, the current web UI is a full-browser conversation. The studio, editor, device frame and size presets were removed. The plus button creates the requested Latin-script ticket using the current local click time. The audit below records the initial repository findings and first implementation.

The original repository is an Expo SDK 54 / React 19.1 / React Native 0.81.4 project. `expo-router/entry` boots `app/_layout.tsx`, with `/` and the starter `/modal` route. Strict TypeScript, Expo ESLint, automatic React Compiler and static web output are already enabled. No framework migration is needed.

The original `app/index.tsx` combined persistence, message creation, rendering and styles. Inspection confirmed:

| Finding                   | Evidence in original                                                  | Resolution for web                                                                     |
| ------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Fixed contact and content | JSP, J, ticket text embedded in screen                                | Editable contact records, optional ticket template                                     |
| Save/load race            | Both effects run on first mount; empty array can be saved before load | Load gate, serialized writes, errors preserve unreadable data                          |
| ID collisions             | `String(messages.length + 1)`                                         | UUIDs, fallback IDs, fresh IDs on duplicate and migration                              |
| Translucent SMS green     | `rgba(52, 199, 89, 0.3)`                                              | Opaque `#30D158`                                                                       |
| Inactive navigation       | Back, contact and microphone had no actions                           | Conversation list and contact screen; unavailable hardware actions show a local notice |
| Date repetition           | Only hides dates within the same minute                               | Group within 20 minutes, separate calendar dates                                       |
| Layout overlap            | Absolute composer/header, fixed 160/100px list padding                | Flex layout, scrolling message area, visual viewport and safe areas                    |
| No management             | Only an array of messages                                             | Versioned library, multiple conversations, CRUD, duplicate, reorder, backups           |
| Styling scattered         | Screen-owned StyleSheet literals                                      | Shared web CSS tokens and separated presentation/editor components                     |

Preserved: Expo Router, SDK and dependency versions, lockfile, AsyncStorage, assets, static export and existing native components. Starter theme/UI utilities remain for the native and modal routes. The original native screen is retained in `components/messages-native.tsx`, with hydration, IDs, grouping and green-color fixes; the complete v2 editor and preview target the web through Expo platform resolution.

There was no tracked `vercel.json` or custom server. `app.json` already specified `web.output: static`. The added Vercel configuration builds with `npm run build:web` and serves `dist`; it does not change the existing deployment or domain. GitHub deployment settings outside the repository have not been changed.

Baseline validation uses an untouched source snapshot in the ignored `.baseline` directory and the original lockfile dependencies. Original type checking passes; original lint has one unused `initialMessages` warning. Default Metro workers fail with Windows `spawn EPERM` here; a single worker is used for comparable exports. Final validation results are recorded in `VALIDATION.md`.

The task mentioned Apple reference screenshots, but no image attachments were available in this session. Visual work follows the supplied written palette and layout requirements. Pixel-level comparison to those references and physical iPhone keyboard testing remain separate validation steps.
