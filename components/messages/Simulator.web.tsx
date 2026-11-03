import React, { useEffect } from "react";
import Head from "expo-router/head";
import {
  initialLibrary,
  conversation,
  Message,
  ticketMessage,
  uid,
} from "../../lib/messages/model";
import { useLibrary } from "../../lib/messages/useLibrary";
import { Phone } from "./Phone";
import {
  saveContact,
  deleteContact,
  contactSettings,
} from "../../lib/messages/contacts";
import "./messages.css";
import "./glass.css";
import "./chat-header.css";

export default function Simulator() {
  const { library, setLibrary, ready, error, saved, retry, retrySave, commit } =
    useLibrary();

  const contact =
    library.conversations.find((c) => c.id === library.selectedId) ??
    library.conversations[0];

  useEffect(() => {
    const update = () =>
      document.documentElement.style.setProperty(
        "--visual-height",
        `${window.visualViewport?.height ?? window.innerHeight}px`,
      );
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (ready && !library.conversations.length) setLibrary(initialLibrary());
  }, [ready, library.conversations.length, setLibrary]);

  function append(message: Message) {
    if (!contact) return;
    setLibrary((v) => ({
      ...v,
      conversations: v.conversations.map((c) =>
        c.id === contact.id ? { ...c, draft: message.direction === "outgoing" ? "" : c.draft, messages: [...c.messages, message] } : c,
      ),
    }));
  }

  return (
    <>
      <Head>
        <title>JSP_bilet Messages</title>
        <meta
          name="description"
          content="A locally stored Messages simulator."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <meta name="theme-color" content="#000000" />
      </Head>
      <main className="messages-app">
        {!ready ? (
          <div className="loading-screen" role="status">
            {error || "Opening messages…"}
            {error && <button onClick={retry}>Retry loading</button>}
          </div>
        ) : (
          <>
            <Phone
              contact={contact}
              contacts={library.conversations}
              saveStatus={error ? "Changes need saving" : saved ? "Saved on this device" : "Saving…"}
              onDraft={(draft) => {
                if (!contact) return;
                setLibrary((v) => ({ ...v, conversations: v.conversations.map((c) =>
                  c.id === contact.id ? { ...c, draft } : c) }));
              }}
              onCreate={async (name) => {
                const added = conversation(name.trim());
                await commit((v) => ({ ...v, selectedId: added.id,
                  conversations: [...v.conversations, added] }));
              }}
              onSelect={(id) => setLibrary((v) => ({ ...v, selectedId: id }))}
              onSend={(text) =>
                append({
                  id: uid(),
                  text,
                  direction: "outgoing",
                  timestamp: Date.now(),
                })
              }
              onTicket={() => append(ticketMessage())}
              preferences={library.preferences}
              onSaveContact={(id, draft) =>
                commit((v) => saveContact(v, id, draft))
              }
              onDeleteContact={(id) => commit((v) => deleteContact(v, id))}
              onSettings={(id, patch) =>
                commit((v) => ({
                  ...v,
                  conversations: v.conversations.map((c) =>
                    c.id === id
                      ? { ...c, settings: { ...contactSettings(c), ...patch } }
                      : c,
                  ),
                }))
              }
            />
            {error && (
              <div className="storage-error" role="alert">
                {error}
                <button onClick={retrySave}>Retry save</button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
