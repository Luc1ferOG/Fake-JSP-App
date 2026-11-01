import React from "react";
import type { Conversation } from "../../lib/messages/model";
import type { DisplayPreferences } from "../../lib/messages/contactTypes";
import {
  formatConversationTimestamp,
  lastMessage,
} from "../../lib/messages/timestamps";
import ContactAvatar from "./ContactAvatar";
import { Icon } from "./Icon";
export function ConversationListRow({
  contact,
  onSelect,
  now,
  preferences,
}: {
  contact: Conversation;
  onSelect: (id: string) => void;
  now: number;
  preferences?: DisplayPreferences;
}) {
  const last = lastMessage(contact);
  return (
    <button
      className="conversation-list-row"
      onClick={() => onSelect(contact.id)}
    >
      <ContactAvatar uri={contact.avatar} name={contact.name} size={56} />
      <div className="conversation-row-content">
        <div className="conversation-row-heading">
          <strong>{contact.name}</strong>
          <time
            dateTime={last ? new Date(last.timestamp).toISOString() : undefined}
          >
            {formatConversationTimestamp(last?.timestamp, now, preferences)}
          </time>
          <Icon name="next" size={13} />
        </div>
        <p>{last?.text || "No messages"}</p>
      </div>
    </button>
  );
}
