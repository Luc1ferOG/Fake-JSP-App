import React from "react";
import type { Conversation } from "../../lib/messages/model";
import ContactAvatar from "./ContactAvatar";
import { GlassButton } from "./Glass";
import { Icon } from "./Icon";

export function ChatHeader({
  contact,
  onBack,
  onProfile,
  onVideo,
}: {
  contact: Conversation;
  onBack: () => void;
  onProfile: () => void;
  onVideo: () => void;
}) {
  return (
    <header className="chat-header">
      <span
        className="header-progressive-blur header-blur-middle"
        aria-hidden="true"
      />
      <span
        className="header-progressive-blur header-blur-top"
        aria-hidden="true"
      />
      <GlassButton
        round
        className="back-button"
        aria-label="All conversations"
        onClick={onBack}
      >
        <Icon name="back" size={26} />
      </GlassButton>
      <button
        className="contact-heading"
        onClick={onProfile}
        aria-label={`Contact information for ${contact.name}`}
      >
        <ContactAvatar uri={contact.avatar} name={contact.name} size={56} />
        <span className="contact-name-capsule">
          <span className="contact-name-text">{contact.name}</span>
          <Icon name="next" size={11} />
        </span>
      </button>
      <GlassButton
        round
        className="video-button"
        aria-label="Video call simulation"
        onClick={onVideo}
      >
        <Icon name="video" size={23} />
      </GlassButton>
    </header>
  );
}
