import type { Conversation } from "./model.ts";
import type { DisplayPreferences } from "./contactTypes.ts";

/** The bottom message in the user's timeline, including after a reorder. */
export function lastMessage(c: Conversation) {
  return c.messages.at(-1);
}
export function sortConversations(contacts: Conversation[]): Conversation[] {
  return contacts
    .map((c, index) => ({ c, index }))
    .sort((a, b) => {
      const at = lastMessage(a.c)?.timestamp;
      const bt = lastMessage(b.c)?.timestamp;
      if (at === undefined) return bt === undefined ? a.index - b.index : 1;
      if (bt === undefined) return -1;
      return bt - at || a.index - b.index;
    })
    .map((item) => item.c);
}
function calendarDate(timestamp: number, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  }).formatToParts(timestamp);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    ordinal: Date.UTC(get("year"), get("month") - 1, get("day")) / 86400000,
    year: get("year"),
  };
}
export function formatConversationTimestamp(
  timestamp: number | undefined,
  now = Date.now(),
  preferences: DisplayPreferences = {},
): string {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return "";
  const { locale, timeZone, hour12 } = preferences;
  const today = calendarDate(now, timeZone),
    date = calendarDate(timestamp, timeZone);
  const days = today.ordinal - date.ordinal;
  const fullDate = () =>
    new Intl.DateTimeFormat(locale, {
      timeZone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(timestamp);
  if (today.year !== date.year) return fullDate();
  if (days === 0)
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      ...(hour12 === undefined ? {} : { hourCycle: hour12 ? "h12" : "h23" }),
    }).format(timestamp);
  if (days === 1) {
    const word = new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
    }).format(-1, "day");
    return word.charAt(0).toLocaleUpperCase(locale) + word.slice(1);
  }
  if (days > 1 && days < 7)
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "long",
    }).format(timestamp);
  // Explicit dates avoid describing future simulator messages as past weekdays.
  return fullDate();
}
