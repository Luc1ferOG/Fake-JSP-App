import React, { useState } from "react";
import { Image } from "expo-image";
import { DEFAULT_AVATAR_URI } from "../../lib/messages/avatar";

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
    <Image
      source={{ uri: uri && failedUri !== uri ? uri : DEFAULT_AVATAR_URI }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
      }}
      contentFit="cover"
      accessibilityLabel={`Profile picture for ${name}`}
      onError={() => {
        if (uri) setFailedUri(uri);
      }}
    />
  );
}
