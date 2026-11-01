import React, { useState } from "react";
import type { Conversation } from "../../lib/messages/model";
import type {
  ContactDraft,
  ContactSettings,
} from "../../lib/messages/contactTypes";
import { contactDraft, contactSettings } from "../../lib/messages/contacts";
import ContactAvatar from "./ContactAvatar";
import { ContactEditorSheet } from "./ContactEditorSheet";
import { GlassButton, GlassSurface } from "./Glass";
import { Icon } from "./Icon";
import { LocalDialog } from "./LocalDialog";

export function ContactProfile({
  contact,
  onBack,
  onSave,
  onDelete,
  onSettings,
}: {
  contact: Conversation;
  onBack: () => void;
  onSave: (id: string, draft: ContactDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSettings: (id: string, settings: Partial<ContactSettings>) => Promise<void>;
}) {
  const [tab, setTab] = useState<"Info" | "Photos" | "Locations">("Info");
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<
    "block" | "contacts" | "learn" | "phone" | "video" | "email" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [callTarget, setCallTarget] = useState("");
  const [error, setError] = useState("");
  const profile = contactDraft(contact);
  const settings = contactSettings(contact);
  const phone = profile.phones[0]?.value;
  const email = profile.fields.find((f) => f.kind === "email")?.value;
  async function setting(patch: Partial<ContactSettings>) {
    setBusy(true);
    setError("");
    try {
      await onSettings(contact.id, patch);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    block: settings.blocked ? "Unblock Contact?" : "Block Contact?",
    contacts: contact.name,
    learn: "About this conversation",
    phone: "Simulated phone call",
    video: "Simulated video call",
    email: "Simulated email",
  };
  return (
    <section
      className="contact-profile"
      aria-label={`Contact profile for ${contact.name}`}
    >
      <div
        className="profile-main"
        inert={editing || dialog !== null ? true : undefined}
      >
        <nav className="profile-navigation">
          <GlassButton round aria-label="Back to conversation" onClick={onBack}>
            <Icon name="back" size={25} />
          </GlassButton>
          <GlassButton
            className="profile-edit-button"
            onClick={() => setEditing(true)}
          >
            Edit
          </GlassButton>
        </nav>
        <div className="profile-identity">
          <ContactAvatar uri={contact.avatar} name={contact.name} size={112} />
          <h1>{contact.name}</h1>
          <div className="profile-actions">
            {(["phone", "video", "email"] as const).map((action) => (
              <GlassButton
                key={action}
                round
                disabled={action === "email" ? !email : !phone}
                aria-label={
                  action === "phone"
                    ? "Call contact"
                    : action === "video"
                      ? "Video call contact"
                      : "Email contact"
                }
                onClick={() => {
                  setCallTarget(phone || "");
                  setDialog(action);
                }}
              >
                <Icon name={action === "email" ? "mail" : action} size={25} />
              </GlassButton>
            ))}
          </div>
        </div>
        <div className="profile-body">
          <div
            className="profile-segments"
            role="tablist"
            aria-label="Contact information"
          >
            {(["Info", "Photos", "Locations"] as const).map((value) => (
              <button
                key={value}
                role="tab"
                id={`tab-${value}`}
                aria-selected={tab === value}
                aria-controls={`panel-${value}`}
                onClick={() => setTab(value)}
                onKeyDown={(e) => {
                  if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                    e.preventDefault();
                    const tabs = ["Info", "Photos", "Locations"] as const;
                    const next =
                      tabs[
                        (tabs.indexOf(tab) + (e.key === "ArrowRight" ? 1 : 2)) %
                          3
                      ];
                    setTab(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
          >
            {tab === "Info" ? (
              <>
                <GlassSurface className="profile-phone-card">
                  {profile.phones.length ? (
                    profile.phones.map((p) => (
                      <div className="profile-number" key={p.id}>
                        <div>
                          <small>{p.label}</small>
                          <span>{p.value}</span>
                        </div>
                        <button
                          aria-label={`Call ${p.value}`}
                          onClick={() => {
                            setCallTarget(p.value);
                            setDialog("phone");
                          }}
                        >
                          <Icon name="phone" size={22} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="profile-number no-phone">
                      No phone numbers
                    </div>
                  )}
                </GlassSurface>
                <GlassSurface className="profile-settings">
                  <SettingToggle
                    label="Hide Alerts"
                    checked={settings.hideAlerts}
                    disabled={busy}
                    onChange={(checked) => {
                      void setting({ hideAlerts: checked });
                    }}
                  />
                  <SettingToggle
                    label="Show in Shared with You"
                    checked={settings.sharedWithYou}
                    disabled={busy}
                    onChange={(checked) => {
                      void setting({ sharedWithYou: checked });
                    }}
                  />
                </GlassSurface>
                <GlassSurface className="profile-settings">
                  <button
                    className="profile-setting-row"
                    onClick={() => {
                      if (contact.contactDeleted) setEditing(true);
                      else {
                        setDialog("contacts");
                        if (!settings.inContacts)
                          void setting({ inContacts: true });
                      }
                    }}
                  >
                    Show in Contacts
                    <Icon name="next" size={15} />
                  </button>
                </GlassSurface>
                <GlassSurface className="profile-settings">
                  <button
                    className="profile-setting-row destructive"
                    onClick={() => setDialog("block")}
                  >
                    {settings.blocked ? "Unblock Contact" : "Block Contact"}
                  </button>
                </GlassSurface>
                <p className="encryption-caption">
                  This conversation is not encrypted.{" "}
                  <button onClick={() => setDialog("learn")}>
                    Learn more...
                  </button>
                </p>
              </>
            ) : tab === "Photos" ? (
              <>
                {!settings.sharedWithYou ? (
                  <EmptyState
                    icon="image"
                    title="Shared with You is off"
                    description="Turn it on in Info to include shared photos."
                  />
                ) : contact.sharedImages?.length ? (
                  <div className="shared-photos">
                    {contact.sharedImages.map((photo) => (
                      <figure key={photo.id}>
                        <img
                          src={photo.uri}
                          alt={photo.caption || "Shared photo"}
                        />
                        <figcaption>{photo.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="image"
                    title="No Shared Photos"
                    description="Photos shared in this conversation will appear here."
                  />
                )}
              </>
            ) : (
              <>
                {contact.sharedLocations?.length ? (
                  contact.sharedLocations.map((location) => (
                    <GlassSurface className="shared-location" key={location.id}>
                      <Icon name="location" size={26} />
                      <div>
                        <strong>{location.label}</strong>
                        <p>
                          {location.latitude.toFixed(5)},{" "}
                          {location.longitude.toFixed(5)}
                        </p>
                      </div>
                    </GlassSurface>
                  ))
                ) : (
                  <EmptyState
                    icon="location"
                    title="No Shared Locations"
                    description="Locations shared in this conversation will appear here."
                  />
                )}
              </>
            )}
          </div>
          {error && (
            <p className="profile-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      {editing && (
        <ContactEditorSheet
          key={contact.id}
          contact={contact}
          onClose={() => setEditing(false)}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
      {dialog && (
        <LocalDialog
          title={titles[dialog]}
          onClose={() => {
            if (!busy) setDialog(null);
          }}
          busy={busy}
          onConfirm={
            dialog === "block"
              ? () => {
                  void setting({ blocked: !settings.blocked }).then((ok) => {
                    if (ok) setDialog(null);
                  });
                }
              : undefined
          }
          confirmLabel={settings.blocked ? "Unblock" : "Block"}
          destructive={dialog === "block"}
        >
          {dialog === "block" ? (
            <>
              <p>
                {settings.blocked
                  ? "Allow simulated incoming messages from this contact again?"
                  : "Simulated incoming messages from this contact will be blocked. Existing messages will stay in the conversation."}
              </p>
              {error && (
                <p role="alert" className="profile-error">
                  {error}
                </p>
              )}
            </>
          ) : dialog === "contacts" ? (
            <div className="local-contact-card">
              <ContactAvatar
                uri={contact.avatar}
                name={contact.name}
                size={80}
              />
              <p>
                {settings.inContacts
                  ? "Saved in your local contacts"
                  : "Not saved in your local contacts"}
              </p>
              {profile.phones.map((p) => (
                <p key={p.id}>
                  {p.label}: {p.value}
                </p>
              ))}
              {profile.fields.map((f) => (
                <p key={f.id}>
                  {f.label}: {f.value}
                </p>
              ))}
              {profile.notes && <p>{profile.notes}</p>}
            </div>
          ) : dialog === "learn" ? (
            <p>
              This locally stored simulator does not send SMS or use end-to-end
              encryption. Messages remain in this browser.
            </p>
          ) : (
            <p>
              {dialog === "email" ? email : callTarget || phone}
              <br />
              {dialog === "email"
                ? "Your simulated email is ready. No email will be sent."
                : "This is a local simulation. No call will be placed."}
            </p>
          )}
        </LocalDialog>
      )}
    </section>
  );
}
function SettingToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="profile-setting-row">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        className="ios-switch"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: "image" | "location";
  title: string;
  description: string;
}) {
  return (
    <div className="profile-empty">
      <Icon name={icon} size={38} />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
