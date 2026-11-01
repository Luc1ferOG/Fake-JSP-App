import { type Conversation, type Library, uid } from "./model.ts";
import {
  type ContactDraft,
  type ContactSettings,
  type FieldKind,
  isContactProfile,
} from "./contactTypes.ts";

export function contactSettings(c: Conversation): ContactSettings {
  return {
    hideAlerts: false,
    sharedWithYou: true,
    blocked: false,
    inContacts: !c.contactDeleted,
    ...c.settings,
  };
}
export function contactDraft(c: Conversation): ContactDraft {
  if (c.profile)
    return {
      ...c.profile,
      avatar: c.avatar,
      phones: c.profile.phones.map((n) => ({ ...n })),
      fields: c.profile.fields.map((f) => ({ ...f })),
    };
  // Legacy multiword names split once; a single name such as JSP_bilet stays intact.
  const [firstName = "", ...rest] = c.contactDeleted
    ? []
    : c.name.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
    company: "",
    phones: c.phone
      ? [{ id: `${c.id}-phone`, label: "mobile", value: c.phone }]
      : [],
    fields: [],
    notes: "",
    ringtone: "Default",
    textTone: "Default",
    avatar: c.avatar,
  };
}
export function addContactField(
  draft: ContactDraft,
  kind: FieldKind,
): ContactDraft {
  return {
    ...draft,
    fields: [
      ...draft.fields,
      {
        id: uid(),
        kind,
        label:
          kind === "email"
            ? "home"
            : kind === "url"
              ? "homepage"
              : kind === "date"
                ? "anniversary"
                : kind,
        value: "",
      },
    ],
  };
}
export function validateContactDraft(draft: ContactDraft): string[] {
  if (!isContactProfile(draft) || typeof draft.avatar !== "string")
    return ["The contact data is invalid."];
  const errors: string[] = [];
  if (
    ![
      draft.firstName,
      draft.lastName,
      draft.company,
      ...draft.phones.map((n) => n.value),
      ...draft.fields.filter((f) => f.kind === "email").map((f) => f.value),
    ].some((s) => s.trim())
  )
    errors.push("Enter a name, company, phone number or email address.");
  for (const p of draft.phones)
    if (
      p.value.trim() &&
      (!/^[+\d\s().*#-]+$/.test(p.value) || !/\d/.test(p.value))
    )
      errors.push(
        "Phone numbers may contain digits, spaces, +, parentheses, hyphens, * and #.",
      );
  for (const f of draft.fields) {
    const value = f.value.trim();
    if (!value) continue;
    if (f.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      errors.push("Enter a valid email address.");
    if (f.kind === "url") {
      try {
        if (!["https:", "http:"].includes(new URL(value).protocol))
          throw new Error();
      } catch {
        errors.push("URLs must begin with https:// or http://.");
      }
    }
    if (
      ["birthday", "date"].includes(f.kind) &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(`${value}T12:00:00Z`)) ||
        new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value)
    )
      errors.push("Enter a valid calendar date.");
  }
  return [...new Set(errors)];
}
export function saveContact(
  library: Library,
  id: string,
  draft: ContactDraft,
): Library {
  const errors = validateContactDraft(draft);
  if (errors.length) throw new Error(errors.join(" "));
  if (!library.conversations.some((c) => c.id === id))
    throw new Error("This conversation no longer exists.");
  const { avatar, ...profile } = draft;
  const clean = {
    ...profile,
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    company: profile.company.trim(),
    phones: profile.phones
      .filter((n) => n.value.trim())
      .map((n) => ({ ...n, value: n.value.trim() })),
    fields: profile.fields
      .filter((f) => f.value.trim())
      .map((f) => ({ ...f, value: f.value.trim() })),
  };
  const name =
    [clean.firstName, clean.lastName].filter(Boolean).join(" ") ||
    clean.company ||
    clean.phones[0]?.value ||
    clean.fields.find((f) => f.kind === "email")?.value ||
    "Unknown";
  return {
    ...library,
    conversations: library.conversations.map((c) =>
      c.id === id
        ? {
            ...c,
            name,
            phone: clean.phones[0]?.value ?? "",
            avatar,
            profile: clean,
            contactDeleted: false,
            settings: { ...contactSettings(c), inContacts: true },
          }
        : c,
    ),
  };
}
export function deleteContact(library: Library, id: string): Library {
  return {
    ...library,
    conversations: library.conversations.map((c) =>
      c.id === id
        ? {
            ...c,
            name: c.phone || "Unknown Contact",
            initials: "",
            avatar: "",
            profile: undefined,
            contactDeleted: true,
            settings: { ...contactSettings(c), inContacts: false },
          }
        : c,
    ),
  };
}
