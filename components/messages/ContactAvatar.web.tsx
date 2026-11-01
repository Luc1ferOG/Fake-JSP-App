import React, { useState } from "react";
import { AVATAR_BACKGROUND, AVATAR_BUST_PATH } from "../../lib/messages/avatar";

export interface ContactAvatarProps {
  size?: number;
  uri?: string;
  name?: string;
}
export default function ContactAvatar({
  size = 52,
  uri,
  name = "contact",
}: ContactAvatarProps) {
  const [failedUri, setFailedUri] = useState<string>();
  return (
    <span
      className="contact-avatar"
      role="img"
      aria-label={`Profile picture for ${name}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        flexShrink: 0,
        background: AVATAR_BACKGROUND,
      }}
    >
      {uri && failedUri !== uri ? (
        <img
          src={uri}
          alt=""
          onError={() => setFailedUri(uri)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="50" fill={AVATAR_BACKGROUND} />
          <circle cx="50" cy="34" r="17" fill="#FFFFFF" />
          <path d={AVATAR_BUST_PATH} fill="#FFFFFF" />
        </svg>
      )}
    </span>
  );
}
