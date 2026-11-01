import {
  isContactProfile,
  type ContactProfile,
  type ContactSettings,
  type DisplayPreferences,
  type SharedImage,
  type SharedLocation,
} from "./contactTypes.ts";
export type Direction = "incoming" | "outgoing";
export interface Message {
  id: string;
  text: string;
  direction: Direction;
  timestamp: number;
}
export interface Conversation {
  id: string;
  name: string;
  initials: string;
  phone: string;
  avatar: string;
  date: number;
  messages: Message[];
  profile?: ContactProfile;
  settings?: ContactSettings;
  contactDeleted?: boolean;
  sharedImages?: SharedImage[];
  sharedLocations?: SharedLocation[];
}
export interface Library {
  version: 2;
  contactSetupVersion?: 1;
  selectedId: string;
  conversations: Conversation[];
  preferences?: DisplayPreferences;
}
let sequence = 0;
export function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}
export function conversation(name = "New contact"): Conversation {
  return {
    id: uid(),
    name,
    initials: name.slice(0, 1).toUpperCase(),
    phone: "",
    avatar: "",
    date: Date.now(),
    messages: [],
  };
}
export function ticket(timestamp: number) {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Kupivte bilet za edno vozenje so cena od 40den na ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} chasot.`;
}
export function ticketMessage(timestamp = Date.now()): Message {
  return {
    id: uid(),
    text: ticket(timestamp),
    direction: "incoming",
    timestamp,
  };
}
export function initialLibrary(): Library {
  const c = conversation("JSP_bilet");
  c.initials = "J";
  c.phone = "141 114";
  return prepareContacts({ version: 2, selectedId: c.id, conversations: [c] });
}

// Apply the requested demo contacts once, without replacing saved conversations or images.
export function prepareContacts(library: Library, now = Date.now()): Library {
  if (library.contactSetupVersion === 1) return library;
  const contacts = library.conversations
    .filter((c) => c.name.trim().toLowerCase() !== "new contact")
    .map((c) => (c.name.trim() === "JSP" ? { ...c, name: "JSP_bilet" } : c));
  if (!contacts.some((c) => c.name === "JSP_bilet")) {
    const jsp = conversation("JSP_bilet");
    jsp.phone = "141 114";
    contacts.unshift(jsp);
  }
  const chats: [string, string[]][] = [
    [
      "Daniel Sion Inter",
      [
        "Кај си брат, слободен си вечер?",
        "Да, само да завршам со работа.",
        "Ајде да го гледаме Интер кај мене.",
        "Важи, ќе земам нешто за јадење.",
        "Супер, во осум почнува.",
        "Ќе дојдам малку порано.",
        "Пиши кога ќе тргнеш.",
        "Тргнав, за десет минути сум таму.",
      ],
    ],
    [
      "Strezo Naafiri Fucker",
      [
        "Ќе играме една партија вечер?",
        "Може, ама после девет.",
        "Важи, ќе те чекам.",
        "Само да вечерам и влегувам.",
        "Јас веќе сум онлајн.",
        "Еве ме, пушти покана.",
        "После ова правиме пауза?",
        "Да, утре станувам рано.",
      ],
    ],
    [
      "Stefan Kolega",
      [
        "Здраво, го заврши извештајот?",
        "Уште последната табела и готов е.",
        "Состанокот го поместија за единаесет.",
        "Одлично, ќе стигнам да го проверам.",
        "Ти пратив неколку забелешки по мејл.",
        "Ги видов, сега ги средувам.",
        "Фала ти, се гледаме во канцеларија.",
        "Се гледаме, ќе земам и кафе.",
      ],
    ],
    [
      "Tato",
      [
        "Сине, кога ќе се вратиш дома?",
        "За околу половина час, чекам автобус.",
        "Да те земам со кола?",
        "Нема потреба, еве доаѓа автобусот.",
        "Добро, јави се кога ќе стигнеш.",
        "Важи. Треба ли нешто од продавница?",
        "Само леб ако можеш.",
        "Ќе земам, се гледаме наскоро.",
      ],
    ],
    [
      "Mama",
      [
        "Јадеше ли денес?",
        "Да мамо, јадев на пауза.",
        "Направив ручек, ќе ти оставам.",
        "Фала ти ❤️ Ќе дојдам после шест.",
        "Земи си јакна, навечер е ладно.",
        "Ја носам со мене, не се грижи.",
        "Добро, пиши ми кога ќе тргнеш.",
        "Тргнувам сега, доаѓам наскоро.",
      ],
    ],
  ];
  chats.forEach(([name, lines], chatIndex) => {
    if (contacts.some((c) => c.name === name)) return;
    const c = conversation(name);
    const start = now - (chatIndex + 1) * 86400000;
    c.date = start;
    c.messages = lines.map((text, index) => ({
      id: uid(),
      text,
      direction: index % 2 === 0 ? "incoming" : "outgoing",
      timestamp: start + index * 120000,
    }));
    contacts.push(c);
  });
  const selectedId = contacts.some((c) => c.id === library.selectedId)
    ? library.selectedId
    : contacts[0].id;
  return {
    ...library,
    contactSetupVersion: 1,
    selectedId,
    conversations: contacts,
  };
}
function isMessage(m: unknown): m is Message {
  if (!m || typeof m !== "object") return false;
  const v = m as Message;
  return (
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    ["incoming", "outgoing"].includes(v.direction) &&
    Number.isFinite(v.timestamp) &&
    !isNaN(new Date(v.timestamp).getTime())
  );
}
export function decodeLibrary(raw: string): Library {
  const v = JSON.parse(raw) as Library;
  if (
    v.version !== 2 ||
    !Array.isArray(v.conversations) ||
    typeof v.selectedId !== "string"
  )
    throw new Error("Unsupported saved library");
  const ids = new Set<string>();
  for (const c of v.conversations) {
    if (
      !c ||
      typeof c.id !== "string" ||
      ids.has(c.id) ||
      !["name", "initials", "phone", "avatar"].every(
        (k) => typeof c[k as keyof Conversation] === "string",
      ) ||
      !Number.isFinite(c.date) ||
      isNaN(new Date(c.date).getTime()) ||
      !Array.isArray(c.messages) ||
      !c.messages.every(isMessage) ||
      new Set(c.messages.map((m) => m.id)).size !== c.messages.length
    )
      throw new Error("Invalid saved conversation");
    if (c.profile !== undefined && !isContactProfile(c.profile))
      throw new Error("Invalid contact profile");
    if (
      c.settings !== undefined &&
      (!c.settings ||
        !["hideAlerts", "sharedWithYou", "blocked", "inContacts"].every(
          (k) => typeof c.settings?.[k as keyof ContactSettings] === "boolean",
        ))
    )
      throw new Error("Invalid contact settings");
    if (c.contactDeleted !== undefined && typeof c.contactDeleted !== "boolean")
      throw new Error("Invalid contact state");
    if (
      c.sharedImages !== undefined &&
      (!Array.isArray(c.sharedImages) ||
        !c.sharedImages.every(
          (i) =>
            i &&
            typeof i.id === "string" &&
            typeof i.uri === "string" &&
            (i.caption === undefined || typeof i.caption === "string"),
        ))
    )
      throw new Error("Invalid shared images");
    if (
      c.sharedLocations !== undefined &&
      (!Array.isArray(c.sharedLocations) ||
        !c.sharedLocations.every(
          (l) =>
            l &&
            typeof l.id === "string" &&
            typeof l.label === "string" &&
            Number.isFinite(l.latitude) &&
            Math.abs(l.latitude) <= 90 &&
            Number.isFinite(l.longitude) &&
            Math.abs(l.longitude) <= 180,
        ))
    )
      throw new Error("Invalid shared locations");
    ids.add(c.id);
  }
  if (v.preferences !== undefined) {
    const p = v.preferences;
    if (
      !p ||
      (p.locale !== undefined && typeof p.locale !== "string") ||
      (p.timeZone !== undefined && typeof p.timeZone !== "string") ||
      (p.hour12 !== undefined && typeof p.hour12 !== "boolean")
    )
      throw new Error("Invalid display preferences");
    new Intl.DateTimeFormat(p.locale, { timeZone: p.timeZone });
  }
  return {
    ...v,
    selectedId: ids.has(v.selectedId)
      ? v.selectedId
      : (v.conversations[0]?.id ?? ""),
  };
}
export function migrateLegacy(raw: string): Library {
  const old: unknown = JSON.parse(raw);
  if (!Array.isArray(old)) throw new Error("Invalid legacy messages");
  const v = initialLibrary();
  v.conversations[0].messages = old.map((m) => {
    if (
      !m ||
      typeof m.text !== "string" ||
      !["me", "other"].includes(m.user) ||
      !Number.isFinite(m.timestamp) ||
      isNaN(new Date(m.timestamp).getTime())
    )
      throw new Error("Invalid legacy message");
    return {
      id: uid(),
      text: m.text,
      direction: m.user === "me" ? "outgoing" : "incoming",
      timestamp: m.timestamp,
    };
  });
  return v;
}
export function duplicate(c: Conversation): Conversation {
  return {
    ...c,
    id: uid(),
    name: `${c.name} copy`,
    messages: c.messages.map((m) => ({ ...m, id: uid() })),
  };
}
export function showTimestamp(current: Message, previous?: Message) {
  return (
    !previous ||
    new Date(current.timestamp).toDateString() !==
      new Date(previous.timestamp).toDateString() ||
    Math.abs(current.timestamp - previous.timestamp) >= 20 * 60 * 1000
  );
}
export function moveMessage(
  c: Conversation,
  id: string,
  offset: number,
): Conversation {
  const index = c.messages.findIndex((m) => m.id === id);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= c.messages.length) return c;
  const messages = [...c.messages];
  [messages[index], messages[target]] = [messages[target], messages[index]];
  return { ...c, messages };
}
export function localDate(timestamp: number) {
  const d = new Date(
    timestamp - new Date(timestamp).getTimezoneOffset() * 60000,
  );
  return d.toISOString().slice(0, 16);
}
