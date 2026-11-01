import { test } from "node:test";
import assert from "node:assert/strict";
import {
  conversation,
  decodeLibrary,
  duplicate,
  initialLibrary,
  migrateLegacy,
  moveMessage,
  prepareContacts,
  showTimestamp,
  ticketMessage,
  uid,
} from "../lib/messages/model.ts";
import { createSaveQueue } from "../lib/messages/saveQueue.ts";
import {
  contactDraft,
  contactSettings,
  saveContact,
  deleteContact,
  addContactField,
} from "../lib/messages/contacts.ts";
import {
  lastMessage,
  sortConversations,
  formatConversationTimestamp,
} from "../lib/messages/timestamps.ts";

test("last-message preview follows timeline order for both directions and reordering", () => {
  const c = conversation("A");
  c.messages = [
    { id: "1", direction: "incoming", text: "Received", timestamp: 2000 },
    { id: "2", direction: "outgoing", text: "Sent", timestamp: 1000 },
  ];
  assert.equal(lastMessage(c)?.text, "Sent");
  assert.equal(lastMessage(moveMessage(c, "1", 1))?.text, "Received");
  c.messages.pop();
  assert.equal(lastMessage(c)?.text, "Received");
  c.messages = [];
  assert.equal(lastMessage(c), undefined);
});
test("conversation sorting uses the last message, places empty chats last and preserves ties", () => {
  const a = conversation("A"),
    b = conversation("B"),
    empty = conversation("Empty"),
    tie = conversation("Tie");
  a.date = 99999;
  b.date = 1;
  a.messages = [
    { id: "1", text: "Older", direction: "incoming", timestamp: 100 },
  ];
  b.messages = [
    { id: "2", text: "Newer", direction: "outgoing", timestamp: 200 },
  ];
  tie.messages = [{ ...b.messages[0], id: "3" }];
  const input = [empty, a, b, tie];
  assert.deepEqual(
    sortConversations(input).map((c) => c.name),
    ["B", "Tie", "A", "Empty"],
  );
  assert.equal(input[0], empty);
});
test("relative timestamps use today, yesterday, weekday and explicit date boundaries", () => {
  const prefs = { locale: "en-GB", timeZone: "UTC", hour12: false };
  const now = Date.parse("2026-11-01T20:00:00Z");
  assert.equal(
    formatConversationTimestamp(Date.parse("2026-11-01T19:52:00Z"), now, prefs),
    "19:52",
  );
  assert.equal(
    formatConversationTimestamp(Date.parse("2026-10-31T23:59:00Z"), now, prefs),
    "Yesterday",
  );
  assert.equal(
    formatConversationTimestamp(Date.parse("2026-10-30T12:00:00Z"), now, prefs),
    "Friday",
  );
  assert.equal(
    formatConversationTimestamp(Date.parse("2026-10-26T12:00:00Z"), now, prefs),
    "Monday",
  );
  assert.equal(
    formatConversationTimestamp(Date.parse("2026-10-25T12:00:00Z"), now, prefs),
    "25/10/2026",
  );
  assert.equal(
    formatConversationTimestamp(Date.parse("2025-10-25T12:00:00Z"), now, prefs),
    "25/10/2025",
  );
  assert.equal(formatConversationTimestamp(undefined, now, prefs), "");
});
test("timestamps respect configured time zone and twelve-hour format", () => {
  const timestamp = Date.parse("2026-11-01T19:52:00Z");
  assert.equal(
    formatConversationTimestamp(timestamp, timestamp, {
      locale: "en-US",
      timeZone: "UTC",
      hour12: true,
    }),
    "7:52 PM",
  );
  assert.equal(
    formatConversationTimestamp(timestamp, timestamp, {
      locale: "en-GB",
      timeZone: "Europe/Skopje",
      hour12: false,
    }),
    "20:52",
  );
  assert.equal(
    formatConversationTimestamp(
      Date.parse("2026-11-01T00:52:00Z"),
      Date.parse("2026-11-01T01:00:00Z"),
      { locale: "en-US", timeZone: "UTC", hour12: false },
    ),
    "00:52",
  );
});
test("calendar boundaries handle midnight and DST instead of elapsed 24-hour periods", () => {
  const prefs = {
    locale: "en-US",
    timeZone: "America/New_York",
    hour12: false,
  };
  assert.equal(
    formatConversationTimestamp(
      Date.parse("2026-03-08T04:59:00Z"),
      Date.parse("2026-03-08T07:01:00Z"),
      prefs,
    ),
    "Yesterday",
  );
  assert.equal(
    formatConversationTimestamp(
      Date.parse("2026-11-01T04:30:00Z"),
      Date.parse("2026-11-02T04:45:00Z"),
      prefs,
    ),
    "00:30",
  );
  assert.equal(
    formatConversationTimestamp(
      Date.parse("2026-11-01T22:59:00Z"),
      Date.parse("2026-11-01T23:01:00Z"),
      { locale: "en-GB", timeZone: "Europe/Skopje" },
    ),
    "Yesterday",
  );
});
test("future simulator messages show a date outside today", () => {
  const now = Date.parse("2026-11-01T12:00:00Z");
  const prefs = { locale: "en-GB", timeZone: "UTC", hour12: false };
  assert.equal(
    formatConversationTimestamp(Date.parse("2026-11-01T23:00:00Z"), now, prefs),
    "23:00",
  );
  assert.equal(
    formatConversationTimestamp(Date.parse("2026-11-03T12:00:00Z"), now, prefs),
    "03/11/2026",
  );
  assert.equal(
    formatConversationTimestamp(Date.parse("2027-01-01T12:00:00Z"), now, prefs),
    "01/01/2027",
  );
});

test("messages in another calendar year include the year even near New Year", () => {
  assert.equal(
    formatConversationTimestamp(
      Date.parse("2025-12-31T23:59:00Z"),
      Date.parse("2026-01-01T00:01:00Z"),
      { locale: "en-GB", timeZone: "UTC" },
    ),
    "31/12/2025",
  );
});

test("email-only contacts are valid and use their address as the display name", () => {
  const v = initialLibrary();
  let draft = contactDraft(v.conversations[0]);
  draft.firstName = "";
  draft.lastName = "";
  draft.company = "";
  draft.phones = [];
  draft = addContactField(draft, "email");
  draft.fields[0].value = "local@example.com";
  assert.equal(
    saveContact(v, v.selectedId, draft).conversations[0].name,
    "local@example.com",
  );
});
test("contact draft splits legacy names and cancelling leaves all saved data intact", () => {
  const c = conversation("Daniel Sion Inter");
  c.phone = "070 123 456";
  const before = JSON.stringify(c);
  const draft = contactDraft(c);
  assert.equal(draft.firstName, "Daniel");
  assert.equal(draft.lastName, "Sion Inter");
  draft.firstName = "Unsaved";
  draft.avatar = "new-photo";
  draft.phones[0].value = "123";
  assert.equal(JSON.stringify(c), before);
  assert.equal(contactDraft(conversation("JSP_bilet")).firstName, "JSP_bilet");
});
test("contact saving changes only the requested stable ID and supports multiple phone numbers", () => {
  const v = initialLibrary();
  const c = v.conversations[0];
  const draft = contactDraft(c);
  draft.firstName = "Updated";
  draft.lastName = "Contact";
  draft.phones.push({ id: "work", label: "work", value: "+389 70 123456" });
  draft.notes = "Multiline\nnotes";
  draft.avatar = "data:image/png;base64,photo";
  const next = saveContact(v, c.id, draft);
  assert.equal(next.conversations[0].id, c.id);
  assert.equal(next.conversations[0].name, "Updated Contact");
  assert.equal(next.conversations[0].profile?.phones.length, 2);
  assert.equal(next.conversations[1], v.conversations[1]);
  assert.equal(v.conversations[0].name, "JSP_bilet");
  assert.equal(next.conversations[0].messages, c.messages);
  const restored = decodeLibrary(JSON.stringify(next));
  assert.deepEqual(restored.conversations[0], next.conversations[0]);
});
test("phone removal updates primary phone and rich fields can be added and persisted", () => {
  const v = initialLibrary();
  const c = v.conversations[0];
  let draft = contactDraft(c);
  draft.phones = [{ id: "home", label: "home", value: "123456" }];
  draft = addContactField(draft, "email");
  draft.fields[0].value = "test@example.com";
  draft = addContactField(draft, "birthday");
  draft.fields[1].value = "2000-02-29";
  const next = saveContact(v, c.id, draft);
  assert.equal(next.conversations[0].phone, "123456");
  draft = contactDraft(next.conversations[0]);
  draft.phones = [];
  const removed = saveContact(next, c.id, draft);
  assert.equal(removed.conversations[0].phone, "");
  assert.equal(
    decodeLibrary(JSON.stringify(removed)).conversations[0].profile?.fields
      .length,
    2,
  );
});
test("invalid contact fields are rejected before saved data is changed", () => {
  const v = initialLibrary();
  const draft = addContactField(contactDraft(v.conversations[0]), "email");
  draft.fields[0].value = "not-an-email";
  assert.throws(() => saveContact(v, v.selectedId, draft), /email/);
  draft.fields[0] = {
    id: "birthday",
    kind: "birthday",
    label: "birthday",
    value: "2026-02-30",
  };
  assert.throws(() => saveContact(v, v.selectedId, draft), /calendar/);
  assert.equal(v.conversations[0].profile, undefined);
});
test("deleting a contact preserves the thread, messages and stable ID across refresh", () => {
  const v = initialLibrary();
  const c = v.conversations[0];
  c.messages.push(ticketMessage(1000));
  const next = deleteContact(v, c.id);
  assert.equal(next.conversations.length, v.conversations.length);
  assert.equal(next.conversations[0].id, c.id);
  assert.equal(next.conversations[0].name, c.phone);
  assert.equal(next.conversations[0].messages, c.messages);
  assert.equal(next.conversations[0].contactDeleted, true);
  assert.equal(next.conversations[0].avatar, "");
  assert.equal(
    prepareContacts(decodeLibrary(JSON.stringify(next))).conversations[0]
      .contactDeleted,
    true,
  );
});
test("profile settings and additional fields persist in the existing storage format", () => {
  const v = initialLibrary();
  v.conversations[0].settings = {
    hideAlerts: true,
    sharedWithYou: false,
    blocked: true,
    inContacts: true,
  };
  assert.deepEqual(
    contactSettings(decodeLibrary(JSON.stringify(v)).conversations[0]),
    v.conversations[0].settings,
  );
  const draft = contactDraft(v.conversations[0]);
  const withField = addContactField(draft, "nickname");
  withField.fields[0].value = "Local";
  withField.ringtone = "Chimes";
  withField.textTone = "Note";
  const next = saveContact(v, v.selectedId, withField);
  const restored = contactDraft(
    decodeLibrary(JSON.stringify(next)).conversations[0],
  );
  assert.equal(restored.ringtone, "Chimes");
  assert.equal(restored.fields[0].value, "Local");
  restored.fields[0].value = "Draft change";
  assert.equal(next.conversations[0].profile?.fields[0].value, "Local");
});

test("requested demo contacts contain Macedonian messages from both sides", () => {
  const v = initialLibrary();
  assert.deepEqual(
    v.conversations.map((c) => c.name),
    [
      "JSP_bilet",
      "Daniel Sion Inter",
      "Strezo Naafiri Fucker",
      "Stefan Kolega",
      "Tato",
      "Mama",
    ],
  );
  for (const c of v.conversations.slice(1)) {
    assert.ok(c.messages.some((m) => m.direction === "incoming"));
    assert.ok(c.messages.some((m) => m.direction === "outgoing"));
    assert.ok(c.messages.every((m) => /[А-Ша-шЃѓЌќЉљЊњЏџЅѕЈј]/u.test(m.text)));
  }
});

test("contact setup removes New contact, renames JSP and preserves saved images and messages", () => {
  const jsp = conversation("JSP");
  jsp.avatar = "data:image/png;base64,custom";
  jsp.messages = [ticketMessage(1700000000000)];
  const blank = conversation("New contact");
  const v = prepareContacts({
    version: 2,
    selectedId: blank.id,
    conversations: [jsp, blank],
  });
  assert.equal(v.conversations[0].name, "JSP_bilet");
  assert.equal(v.conversations[0].id, jsp.id);
  assert.equal(v.conversations[0].avatar, jsp.avatar);
  assert.deepEqual(v.conversations[0].messages, jsp.messages);
  assert.equal(v.selectedId, jsp.id);
  assert.equal(
    v.conversations.some((c) => c.name === "New contact"),
    false,
  );
  assert.equal(prepareContacts(v), v);
  assert.equal(
    decodeLibrary(JSON.stringify(v)).conversations[0].avatar,
    jsp.avatar,
  );
});

test("existing sample-name contacts keep their custom data and are not duplicated", () => {
  const mama = conversation("Mama");
  mama.avatar = "custom-image";
  mama.messages = [
    {
      id: uid(),
      text: "Сочувана порака",
      direction: "outgoing",
      timestamp: 1000,
    },
  ];
  const v = prepareContacts({
    version: 2,
    selectedId: mama.id,
    conversations: [mama],
  });
  assert.equal(v.conversations.filter((c) => c.name === "Mama").length, 1);
  assert.deepEqual(
    v.conversations.find((c) => c.name === "Mama"),
    mama,
  );
});

test("ticket text and message timestamp use the same local click time", () => {
  const clickedAt = new Date(2026, 5, 30, 13, 7, 42).getTime();
  const message = ticketMessage(clickedAt);
  assert.equal(
    message.text,
    "Kupivte bilet za edno vozenje so cena od 40den na 30.06.2026 13:07 chasot.",
  );
  assert.equal(message.timestamp, clickedAt);
  assert.equal(message.direction, "incoming");
  const later = ticketMessage(new Date(2026, 6, 1, 0, 3).getTime());
  assert.equal(
    later.text,
    "Kupivte bilet za edno vozenje so cena od 40den na 01.07.2026 00:03 chasot.",
  );
  assert.notEqual(later.id, message.id);
});

test("IDs remain unique when a message is deleted and new messages are created", () => {
  const ids = Array.from({ length: 10000 }, uid);
  assert.equal(new Set(ids).size, ids.length);
});
test("legacy migration preserves Macedonian text, direction and dates while replacing colliding IDs", () => {
  const v = migrateLegacy(
    JSON.stringify([
      { id: "1", text: "Билет", user: "other", timestamp: 1000 },
      { id: "1", text: "OK", user: "me", timestamp: 2000 },
    ]),
  );
  assert.equal(v.conversations[0].messages[0].text, "Билет");
  assert.equal(v.conversations[0].messages[1].direction, "outgoing");
  assert.equal(v.conversations[0].messages[1].timestamp, 2000);
  assert.notEqual(
    v.conversations[0].messages[0].id,
    v.conversations[0].messages[1].id,
  );
  assert.deepEqual(decodeLibrary(JSON.stringify(v)), v);
});
test("unreadable or invalid storage is rejected instead of silently overwritten", () => {
  for (const value of [
    "{",
    "null",
    '{"version":7}',
    '{"version":2,"conversations":[{}],"selectedId":"x"}',
  ])
    assert.throws(() => decodeLibrary(value));
  assert.throws(() =>
    migrateLegacy('[{"text":"x","timestamp":1,"user":"invalid"}]'),
  );
});
test("duplicate is independent with fresh conversation and message identities", () => {
  const c = conversation("JSP");
  c.messages = [
    { id: uid(), text: "Hello", timestamp: 1000, direction: "incoming" },
  ];
  const copy = duplicate(c);
  copy.messages[0].text = "Changed";
  assert.notEqual(c.id, copy.id);
  assert.notEqual(c.messages[0].id, copy.messages[0].id);
  assert.equal(c.messages[0].text, "Hello");
});
test("timestamps group nearby messages and separate longer gaps and calendar dates", () => {
  const m = {
    id: "a",
    text: "Hi",
    direction: "incoming" as const,
    timestamp: new Date(2026, 0, 1, 12).getTime(),
  };
  assert.equal(showTimestamp(m), true);
  assert.equal(
    showTimestamp({ ...m, timestamp: m.timestamp + 60000 }, m),
    false,
  );
  assert.equal(
    showTimestamp({ ...m, timestamp: m.timestamp + 20 * 60000 }, m),
    true,
  );
  const midnight = { ...m, timestamp: new Date(2026, 0, 2, 0, 1).getTime() };
  assert.equal(
    showTimestamp(midnight, { ...m, timestamp: midnight.timestamp - 120000 }),
    true,
  );
});
test("reordering handles boundaries, preserves timestamps and does not mutate the original", () => {
  const c = conversation();
  c.messages = [
    { id: "a", text: "A", direction: "incoming", timestamp: 1 },
    { id: "b", text: "B", direction: "outgoing", timestamp: 2 },
  ];
  const moved = moveMessage(c, "b", -1);
  assert.deepEqual(
    moved.messages.map((m) => m.id),
    ["b", "a"],
  );
  assert.deepEqual(
    c.messages.map((m) => m.id),
    ["a", "b"],
  );
  assert.equal(moved.messages[0].timestamp, 2);
  assert.equal(moveMessage(c, "a", -1), c);
});
test("empty libraries round-trip and missing selections recover safely", () => {
  const v = initialLibrary();
  v.selectedId = "missing";
  assert.equal(
    decodeLibrary(JSON.stringify(v)).selectedId,
    v.conversations[0].id,
  );
  assert.deepEqual(
    decodeLibrary('{"version":2,"selectedId":"gone","conversations":[]}')
      .conversations,
    [],
  );
});
test("duplicate saved identifiers and invalid dates cannot enter the editor", () => {
  const v = initialLibrary();
  v.conversations.push({ ...v.conversations[0] });
  assert.throws(() => decodeLibrary(JSON.stringify(v)));
  const bad = initialLibrary();
  bad.conversations[0].date = 1e20;
  assert.throws(() => decodeLibrary(JSON.stringify(bad)));
});
test("slow writes cannot overwrite a newer library snapshot", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const written: string[] = [];
  const save = createSaveQueue(async (value) => {
    if (value === "older") await gate;
    written.push(value);
  });
  const old = save("older");
  const newer = save("newer");
  await Promise.resolve();
  assert.deepEqual(written, []);
  release();
  await Promise.all([old, newer]);
  assert.deepEqual(written, ["older", "newer"]);
});
test("storage can save again after a quota or permissions failure", async () => {
  const written: string[] = [];
  const save = createSaveQueue(async (value) => {
    if (value === "fail") throw new Error("quota");
    written.push(value);
  });
  await assert.rejects(save("fail"));
  await save("recovered");
  assert.deepEqual(written, ["recovered"]);
});
