import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  decodeLibrary,
  initialLibrary,
  Library,
  migrateLegacy,
  prepareContacts,
} from "./model";
import { createSaveQueue } from "./saveQueue";

const KEY = "messages_simulator_v2";
export function useLibrary() {
  const [library, setLibrary] = useState<Library>(initialLibrary);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const queue = useRef(
    createSaveQueue((value) => AsyncStorage.setItem(KEY, value)),
  );
  const blocked = useRef(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const legacy =
          raw === null ? await AsyncStorage.getItem("chat_messages") : null;
        const data =
          raw !== null
            ? decodeLibrary(raw)
            : legacy !== null
              ? migrateLegacy(legacy)
              : initialLibrary();
        if (active) {
          blocked.current = false;
          setLibrary(prepareContacts(data));
          setError("");
          setReady(true);
        }
      } catch {
        if (active) {
          blocked.current = true;
          setError(
            "Saved data could not be loaded. Your stored data has been preserved. Retry before editing.",
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    if (!ready || blocked.current) return;
    setSaved(false);
    let active = true;
    queue
      .current(JSON.stringify(library))
      .then(() => {
        if (active) {
          setSaved(true);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Changes are not saved. Storage may be full or unavailable. Retry saving.",
          );
      });
    return () => {
      active = false;
    };
  }, [library, ready, retry]);
  return {
    library,
    setLibrary,
    ready,
    error,
    saved,
    retry: () => setRetry((n) => n + 1),
    retrySave: () => setLibrary((v) => ({ ...v })),
    commit: async (change: (current: Library) => Library) => {
      if (!ready || blocked.current)
        throw new Error("Storage is not ready. Please retry loading.");
      const next = change(library);
      try {
        setSaved(false);
        await queue.current(JSON.stringify(next));
        setLibrary(next);
        setSaved(true);
        setError("");
      } catch {
        const message =
          "Could not save changes. Your draft is still open. Storage may be full or unavailable.";
        throw new Error(message);
      }
    },
  };
}
