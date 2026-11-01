export const FIELD_KINDS = [
  "email",
  "pronouns",
  "url",
  "address",
  "birthday",
  "date",
  "related",
  "social",
  "instant",
  "verification",
  "nickname",
  "jobTitle",
  "department",
  "prefix",
  "suffix",
  "phoneticName",
] as const;
export type FieldKind = (typeof FIELD_KINDS)[number];
export interface PhoneNumber {
  id: string;
  label: string;
  value: string;
}
export interface ContactField {
  id: string;
  kind: FieldKind;
  label: string;
  value: string;
}
export interface ContactProfile {
  firstName: string;
  lastName: string;
  company: string;
  phones: PhoneNumber[];
  fields: ContactField[];
  notes: string;
  ringtone: string;
  textTone: string;
}
export interface ContactDraft extends ContactProfile {
  avatar: string;
}
export interface ContactSettings {
  hideAlerts: boolean;
  sharedWithYou: boolean;
  blocked: boolean;
  inContacts: boolean;
}
export interface SharedImage {
  id: string;
  uri: string;
  caption?: string;
}
export interface SharedLocation {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}
export interface DisplayPreferences {
  locale?: string;
  timeZone?: string;
  hour12?: boolean;
}
export function isContactProfile(value: unknown): value is ContactProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as ContactProfile;
  return (
    ["firstName", "lastName", "company", "notes", "ringtone", "textTone"].every(
      (key) => typeof p[key as keyof ContactProfile] === "string",
    ) &&
    Array.isArray(p.phones) &&
    p.phones.every(
      (n) =>
        n &&
        ["id", "label", "value"].every(
          (k) => typeof n[k as keyof PhoneNumber] === "string",
        ),
    ) &&
    new Set(p.phones.map((n) => n.id)).size === p.phones.length &&
    Array.isArray(p.fields) &&
    p.fields.every(
      (f) =>
        f &&
        FIELD_KINDS.includes(f.kind) &&
        ["id", "label", "value"].every(
          (k) => typeof f[k as keyof ContactField] === "string",
        ),
    ) &&
    new Set(p.fields.map((f) => f.id)).size === p.fields.length
  );
}
