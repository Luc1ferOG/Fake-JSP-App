import React from "react";
export type IconName =
  | "back"
  | "next"
  | "plus"
  | "send"
  | "mic"
  | "video"
  | "phone"
  | "search"
  | "edit"
  | "check"
  | "close"
  | "copy"
  | "trash"
  | "up"
  | "down"
  | "image"
  | "message"
  | "expand"
  | "wifi"
  | "signal"
  | "mail"
  | "minus"
  | "location"
  | "person";
// UI icons are drawn locally; no network or external icon assets are required.
const paths: Record<IconName, string> = {
  back: "m15 4-8 8 8 8",
  next: "m9 6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  send: "M12 19V5m-6 6 6-6 6 6",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5m-3 6a6 6 0 0 0 12 0M12 18v4m-4 0h8",
  video: "M3 6h12v12H3z m12 4 6-3v10l-6-3",
  phone: "M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4c0 4-8 2-13-3S1 3 5 3Z",
  search: "M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  edit: "m14 5 5 5M4 20l5-1L21 7l-5-5L4 14v6ZM12 4H3v17h17v-9",
  check: "m5 12 4 4L20 5",
  close: "m6 6 12 12M6 18 18 6",
  copy: "M8 8h12v13H8zM16 8V3H3v13h5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  up: "m6 15 6-6 6 6",
  down: "m6 9 6 6 6-6",
  image: "M3 3h18v18H3z m0 14 6-6 12 10M17 7h.01",
  message: "M21 11a9 9 0 0 1-9 9H3l2-4a9 9 0 1 1 16-5Z",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5",
  wifi: "M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01",
  mail: "M3 5h18v14H3z m0 0 9 8 9-8",
  minus: "M5 12h14",
  location:
    "M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13ZM15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  person: "M4 22v-3a8 8 0 0 1 16 0v3M17 6a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
  signal: "M3 20v-3m6 3v-7m6 7V9m6 11V4",
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
