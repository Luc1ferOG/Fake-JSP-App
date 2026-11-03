import React, { useEffect, useRef, useState } from "react";
import { Conversation, Message, showTimestamp } from "../../lib/messages/model";
import type {
  ContactDraft,
  ContactSettings,
  DisplayPreferences,
} from "../../lib/messages/contactTypes";
import { contactSettings } from "../../lib/messages/contacts";
import { sortConversations } from "../../lib/messages/timestamps";
import { Icon } from "./Icon";
import { ChatHeader } from "./ChatHeader";
import { ContactProfile } from "./ContactProfile";
import { ConversationListRow } from "./ConversationListRow";

export function Phone({
  contact,
  contacts,
  onSelect,
  onSend,
  onTicket,
  onSaveContact,
  onDeleteContact,
  onSettings,
  preferences,
  onDraft,
  onCreate,
  saveStatus,
}: {
  contact?: Conversation;
  contacts: Conversation[];
  onSelect: (id: string) => void;
  onSend: (text: string) => void;
  onTicket: () => void;
  onSaveContact: (id: string, draft: ContactDraft) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onSettings: (id: string, settings: Partial<ContactSettings>) => Promise<void>;
  preferences?: DisplayPreferences;
  onDraft: (text: string) => void;
  onCreate: (name: string) => Promise<void>;
  saveStatus: string;
}) {
  const [page, setPage] = useState<"chat" | "list" | "info">("chat");
  const draft = contact?.draft ?? "";
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(0);
  const scroll = useRef<HTMLDivElement>(null);
  const composerInput = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  useEffect(() => {
    const input = composerInput.current;
    if (input) {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 115)}px`;
    }
  }, [draft, page]);
  useEffect(() => {
    setPage("chat");
    nearBottom.current = true;
  }, [contact?.id]);
  useEffect(() => {
    if (nearBottom.current && scroll.current)
      scroll.current.scrollTo({
        top: scroll.current.scrollHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }, [contact?.messages, page]);
  useEffect(() => {
    const resize = () => {
      if (nearBottom.current && scroll.current)
        scroll.current.scrollTop = scroll.current.scrollHeight;
    };
    window.visualViewport?.addEventListener("resize", resize);
    return () => window.visualViewport?.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (page !== "list") return;
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 60000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [page]);
  const previewOnly = () =>
    setNotice("This action is unavailable in the simulator.");
  const results = sortConversations(contacts).filter((c) =>
    `${c.name} ${c.phone} ${c.messages.map((m) => m.text).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="iphone" aria-label="Messages simulator">
      {page === "list" || !contact ? (
        <>
          <div className="list-header">
            <span>Messages</span>
            <button
              aria-label="New conversation"
              onClick={() => { setCreating(true); setCreateError(""); }}
            >
              <Icon name="edit" />
            </button>
          </div>
          <p className="save-status" role="status" title="Your chats and contacts are saved in this browser. Other browsers have their own data.">{saveStatus}</p>
          {creating && (
            <form className="new-conversation" onSubmit={async (event) => {
              event.preventDefault();
              if (!newName.trim() || createBusy) return;
              setCreateBusy(true);
              setCreateError("");
              try {
                await onCreate(newName);
                setCreating(false);
                setNewName("");
                setSearch("");
                setPage("chat");
              } catch (error) {
                setCreateError(error instanceof Error ? error.message : "Could not save the conversation.");
              } finally { setCreateBusy(false); }
            }}>
              <label htmlFor="new-contact-name">Contact name or phone number</label>
              <input id="new-contact-name" value={newName} disabled={createBusy}
                onChange={(event) => setNewName(event.target.value)} required />
              <div>
                <button type="button" disabled={createBusy} onClick={() => { setCreating(false); setNewName(""); }}>Cancel</button>
                <button type="submit" disabled={createBusy || !newName.trim()}>{createBusy ? "Saving…" : "Create chat"}</button>
              </div>
              {createError && <p role="alert">{createError}</p>}
            </form>
          )}
          <div className="phone-search">
            <Icon name="search" size={17} />
            <input
              placeholder="Search"
              aria-label="Search conversations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="phone-contact-list">
            {results.map((c) => (
              <ConversationListRow
                key={c.id}
                contact={c}
                now={now || Date.now()}
                preferences={preferences}
                onSelect={(id) => {
                  onSelect(id);
                  setPage("chat");
                }}
              />
            ))}
            {!results.length && (
              <p className="phone-empty">
                {search ? "No conversations found." : "No conversations."}
              </p>
            )}
          </div>
        </>
      ) : page === "info" ? (
        <ContactProfile
          contact={contact}
          onBack={() => setPage("chat")}
          onSave={onSaveContact}
          onDelete={onDeleteContact}
          onSettings={onSettings}
        />
      ) : (
        <>
          <ChatHeader
            contact={contact}
            onBack={() => setPage("list")}
            onProfile={() => setPage("info")}
            onVideo={previewOnly}
          />
          <div
            className="message-scroll"
            ref={scroll}
            onScroll={() => {
              const el = scroll.current;
              if (el)
                nearBottom.current =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 100;
            }}
          >
            <div className="sms-caption">Text Message · SMS</div>
            {contact.messages.map((m, index) => (
              <MessageBubble
                key={m.id}
                message={m}
                previous={contact.messages[index - 1]}
                next={contact.messages[index + 1]}
              />
            ))}
          </div>
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                nearBottom.current = true;
                onSend(draft.trim());
              }
            }}
          >
            <button
              type="button"
              className="add-attachment"
              aria-label="Add ticket message"
              onClick={() => {
                const settings = contactSettings(contact);
                if (settings.blocked) {
                  setNotice(
                    "Unblock this contact to receive simulated messages.",
                  );
                  return;
                }
                nearBottom.current = true;
                onTicket();
                if (!settings.hideAlerts)
                  setNotice(`New message from ${contact.name}`);
              }}
            >
              <Icon name="plus" size={25} />
            </button>
            <div className="composer-field">
              <textarea
                ref={composerInput}
                aria-label="Text message"
                rows={1}
                placeholder="Text Message · SMS"
                value={draft}
                onChange={(e) => onDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              {draft.trim() ? (
                <button
                  className="send-button"
                  aria-label="Send simulated message"
                >
                  <Icon name="send" size={21} />
                </button>
              ) : (
                <button
                  type="button"
                  className="mic-button"
                  aria-label="Audio message simulation"
                  onClick={previewOnly}
                >
                  <Icon name="mic" size={22} />
                </button>
              )}
            </div>
          </form>
        </>
      )}
      {notice && page !== "info" && (
        <div role="status" className="phone-notice">
          {notice}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message: m,
  previous,
  next,
}: {
  message: Message;
  previous?: Message;
  next?: Message;
}) {
  const stamp = showTimestamp(m, previous);
  const tail =
    !next || next.direction !== m.direction || showTimestamp(next, m);
  return (
    <>
      {stamp && (
        <div className="message-date">
          {new Date(m.timestamp).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
          <span>
            {" "}
            at{" "}
            {new Date(m.timestamp).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
      <div
        className={`message-row ${m.direction} ${stamp || previous?.direction !== m.direction ? "new-group" : ""}`}
      >
        <div
          className={`bubble ${tail ? "tail" : ""}`}
          title={new Date(m.timestamp).toLocaleString()}
        >
          {m.text}
        </div>
      </div>
    </>
  );
}
