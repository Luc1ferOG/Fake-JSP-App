import React, { useEffect, useRef, useState } from "react";
import type { Conversation } from "../../lib/messages/model";
import { uid } from "../../lib/messages/model";
import type {
  ContactDraft,
  ContactField,
  FieldKind,
} from "../../lib/messages/contactTypes";
import {
  addContactField,
  contactDraft,
  validateContactDraft,
} from "../../lib/messages/contacts";
import ContactAvatar from "./ContactAvatar";
import { Icon } from "./Icon";
import { GlassButton, GlassSurface } from "./Glass";
import { LocalDialog } from "./LocalDialog";
import { useModalFocus } from "./useModalFocus";

const LABELS: Record<FieldKind, string> = {
  email: "Email",
  pronouns: "Pronouns",
  url: "URL",
  address: "Address",
  birthday: "Birthday",
  date: "Date",
  related: "Related Name",
  social: "Social Profile",
  instant: "Instant Message",
  verification: "Verification Code",
  nickname: "Nickname",
  jobTitle: "Job Title",
  department: "Department",
  prefix: "Prefix",
  suffix: "Suffix",
  phoneticName: "Phonetic Name",
};
const ADDITIONAL: FieldKind[] = [
  "nickname",
  "jobTitle",
  "department",
  "prefix",
  "suffix",
  "phoneticName",
];
export function ContactEditorSheet({
  contact,
  onClose,
  onSave,
  onDelete,
}: {
  contact: Conversation;
  onClose: () => void;
  onSave: (id: string, draft: ContactDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => contactDraft(contact));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [selector, setSelector] = useState<"ringtone" | "textTone" | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null);
  useModalFocus(panel, onClose, busy);
  useEffect(() => () => reader.current?.abort(), []);
  function setField(
    key: keyof Pick<
      ContactDraft,
      "firstName" | "lastName" | "company" | "notes"
    >,
    value: string,
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function updateField(id: string, patch: Partial<ContactField>) {
    setDraft((d) => ({
      ...d,
      fields: d.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }
  function add(kind: FieldKind) {
    setDraft((d) => addContactField(d, kind));
  }
  function photo(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG, or WebP image smaller than 2 MB.");
      return;
    }
    reader.current?.abort();
    const current = new FileReader();
    reader.current = current;
    setReadingPhoto(true);
    setError("");
    current.onload = () => {
      if (reader.current !== current) return;
      setDraft((d) => ({ ...d, avatar: String(current.result) }));
      setReadingPhoto(false);
    };
    current.onerror = () => {
      if (reader.current !== current) return;
      setError("This image could not be read.");
      setReadingPhoto(false);
    };
    current.readAsDataURL(file);
  }
  async function save() {
    const errors = validateContactDraft(draft);
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(contact.id, draft);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this contact.");
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await onDelete(contact.id);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not delete this contact.",
      );
      setConfirmDelete(false);
      setBusy(false);
    }
  }
  function fields(kind: FieldKind) {
    return (
      <GlassSurface className="edit-group" key={kind}>
        {draft.fields
          .filter((f) => f.kind === kind)
          .map((f) => (
            <ContactFieldRow
              key={f.id}
              field={f}
              onChange={(patch) => updateField(f.id, patch)}
              onRemove={() =>
                setDraft((d) => ({
                  ...d,
                  fields: d.fields.filter((x) => x.id !== f.id),
                }))
              }
            />
          ))}
        <AddRow label={`Add ${LABELS[kind]}`} onClick={() => add(kind)} />
      </GlassSurface>
    );
  }
  return (
    <div className="editor-backdrop">
      <div
        ref={panel}
        className="contact-editor-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Edit contact"
      >
        <div
          className="sheet-content"
          inert={confirmDelete || selector !== null || busy ? true : undefined}
        >
          <div className="sheet-photo">
            <ContactAvatar
              uri={draft.avatar}
              name={[draft.firstName, draft.lastName].join(" ")}
              size={112}
            />
            <GlassButton onClick={() => photoInput.current?.click()}>
              {readingPhoto
                ? "Reading photo…"
                : draft.avatar
                  ? "Change Photo"
                  : "Add Photo"}
            </GlassButton>
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose contact photo"
              hidden
              onChange={(e) => {
                photo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {draft.avatar && (
              <button
                className="remove-photo"
                onClick={() => {
                  reader.current?.abort();
                  reader.current = null;
                  setReadingPhoto(false);
                  setDraft((d) => ({ ...d, avatar: "" }));
                }}
              >
                Remove Photo
              </button>
            )}
          </div>
          <GlassSurface className="edit-group name-fields">
            {(["firstName", "lastName", "company"] as const).map(
              (key, index) => (
                <input
                  key={key}
                  aria-label={["First name", "Last name", "Company"][index]}
                  placeholder={["First name", "Last name", "Company"][index]}
                  autoComplete="off"
                  maxLength={100}
                  value={draft[key]}
                  onChange={(e) => setField(key, e.target.value)}
                />
              ),
            )}
          </GlassSurface>
          <GlassSurface className="edit-group">
            {draft.phones.map((p, index) => (
              <div className="contact-field-row phone-field" key={p.id}>
                <button
                  className="field-remove"
                  aria-label={`Remove phone ${index + 1}`}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      phones: d.phones.filter((n) => n.id !== p.id),
                    }))
                  }
                >
                  <Icon name="minus" size={14} />
                </button>
                <label className="phone-label">
                  <span className="sr-only">Phone {index + 1} type</span>
                  <select
                    aria-label={`Phone ${index + 1} type`}
                    value={p.label}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        phones: d.phones.map((n) =>
                          n.id === p.id ? { ...n, label: e.target.value } : n,
                        ),
                      }))
                    }
                  >
                    {["mobile", "home", "work", "main", "other"].map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <Icon name="next" size={11} />
                </label>
                <input
                  type="tel"
                  aria-label={`Phone ${index + 1} number`}
                  value={p.value}
                  placeholder="number"
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      phones: d.phones.map((n) =>
                        n.id === p.id ? { ...n, value: e.target.value } : n,
                      ),
                    }))
                  }
                />
              </div>
            ))}
            <AddRow
              label="Add Phone"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  phones: [
                    ...d.phones,
                    { id: uid(), label: "mobile", value: "" },
                  ],
                }))
              }
            />
          </GlassSurface>
          {fields("email")}
          {fields("pronouns")}
          <GlassSurface className="edit-group tone-group">
            {(["ringtone", "textTone"] as const).map((key) => (
              <button
                className="tone-row"
                key={key}
                onClick={() => setSelector(key)}
              >
                <span>{key === "ringtone" ? "Ringtone" : "Text Tone"}</span>
                <span>
                  {draft[key]}
                  <Icon name="next" size={13} />
                </span>
              </button>
            ))}
          </GlassSurface>
          {(
            [
              "url",
              "address",
              "birthday",
              "date",
              "related",
              "social",
              "instant",
            ] as const
          ).map(fields)}
          <GlassSurface className="edit-group notes-group">
            <label>
              Notes
              <textarea
                rows={4}
                maxLength={10000}
                aria-label="Notes"
                value={draft.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </label>
          </GlassSurface>
          {fields("verification")}
          {ADDITIONAL.filter((kind) =>
            draft.fields.some((f) => f.kind === kind),
          ).map(fields)}
          <GlassSurface className="edit-group">
            <label className="add-field-picker">
              <span className="field-add-icon">
                <Icon name="plus" size={15} />
              </span>
              <span>Add Field</span>
              <select
                aria-label="Add Field"
                value=""
                onChange={(e) => {
                  if (e.target.value) add(e.target.value as FieldKind);
                }}
              >
                <option value="" disabled>
                  Add Field
                </option>
                {ADDITIONAL.map((kind) => (
                  <option key={kind} value={kind}>
                    {LABELS[kind]}
                  </option>
                ))}
              </select>
              <Icon name="next" size={13} />
            </label>
          </GlassSurface>
          {!contact.contactDeleted && (
            <GlassSurface className="edit-group">
              <button
                className="delete-contact-row"
                onClick={() => setConfirmDelete(true)}
              >
                Delete Contact
              </button>
            </GlassSurface>
          )}
        </div>
        <nav
          className="sheet-navigation"
          aria-label="Contact editor actions"
          inert={confirmDelete || selector !== null ? true : undefined}
        >
          <GlassButton
            round
            aria-label="Cancel contact editing"
            disabled={busy}
            onClick={onClose}
          >
            <Icon name="close" size={22} />
          </GlassButton>
          <GlassButton
            round
            aria-label="Save contact"
            className="save-contact"
            disabled={busy || readingPhoto}
            onClick={() => {
              void save();
            }}
          >
            <Icon name="check" size={23} />
          </GlassButton>
        </nav>
        {error && (
          <div className="sheet-error" role="alert">
            {error}
          </div>
        )}
        {busy && (
          <div className="sheet-saving" role="status">
            Saving…
          </div>
        )}
        {selector && (
          <LocalDialog
            title={selector === "ringtone" ? "Ringtone" : "Text Tone"}
            onClose={() => setSelector(null)}
          >
            <div className="tone-options">
              {(selector === "ringtone"
                ? ["Default", "Reflection", "Opening", "Chimes", "None"]
                : ["Default", "Note", "Chime", "Glass", "None"]
              ).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setDraft((d) => ({ ...d, [selector]: value }));
                    setSelector(null);
                  }}
                >
                  {value}
                  {draft[selector] === value && <Icon name="check" size={17} />}
                </button>
              ))}
            </div>
          </LocalDialog>
        )}
        {confirmDelete && (
          <LocalDialog
            title="Delete Contact?"
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => {
              void remove();
            }}
            confirmLabel="Delete Contact"
            destructive
            busy={busy}
          >
            <p>
              This removes the saved contact details and photo. The conversation
              and every message will stay under{" "}
              {contact.phone || "Unknown Contact"}.
            </p>
          </LocalDialog>
        )}
      </div>
    </div>
  );
}
function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="add-contact-row" onClick={onClick}>
      <span className="field-add-icon">
        <Icon name="plus" size={15} />
      </span>
      {label}
    </button>
  );
}
function ContactFieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: ContactField;
  onChange: (patch: Partial<ContactField>) => void;
  onRemove: () => void;
}) {
  const label = LABELS[field.kind];
  const type = ["birthday", "date"].includes(field.kind)
    ? "date"
    : field.kind === "email"
      ? "email"
      : field.kind === "url"
        ? "url"
        : "text";
  return (
    <div
      className={`contact-field-row ${field.kind === "address" ? "address-field" : ""}`}
    >
      <button
        className="field-remove"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
      >
        <Icon name="minus" size={14} />
      </button>
      <input
        className="field-label-input"
        aria-label={`${label} label`}
        value={field.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />
      {field.kind === "address" ? (
        <textarea
          aria-label={label}
          placeholder="Street, city, postal code, country"
          rows={3}
          value={field.value}
          onChange={(e) => onChange({ value: e.target.value })}
        />
      ) : (
        <input
          aria-label={label}
          type={type}
          placeholder={label.toLowerCase()}
          value={field.value}
          onChange={(e) => onChange({ value: e.target.value })}
        />
      )}
    </div>
  );
}
