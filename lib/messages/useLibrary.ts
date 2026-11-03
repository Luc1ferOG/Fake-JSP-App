import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { decodeLibrary, initialLibrary, type Library, migrateLegacy, prepareContacts } from "./model";
import { createLibrarySession } from "./librarySession";
import { libraryStorage } from "./storage";

const KEY = "messages_simulator_v2";

export function useLibrary() {
  const [library, updateLibrary] = useState<Library>(initialLibrary);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);
  const session = useRef<ReturnType<typeof createLibrarySession> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await libraryStorage.read(KEY);
        const legacy = raw === null ? await libraryStorage.read("chat_messages") : null;
        const data = prepareContacts(raw !== null ? decodeLibrary(raw)
          : legacy !== null ? migrateLegacy(legacy) : initialLibrary());
        if (!active) return;
        session.current = createLibrarySession(data,
          (value) => libraryStorage.write(KEY, value),
          (value, isSaved, message) => {
            if (!active) return;
            updateLibrary(value);
            setSaved(isSaved);
            setError(message);
          });
        updateLibrary(data);
        setError("");
        setReady(true);
        // Persist first visits and migrations only after loading existing data.
        void session.current.retry().catch(() => {});
      } catch {
        if (active) {
          session.current = null;
          setReady(false);
          setError("Saved data could not be loaded. Your stored data has been preserved. Retry before editing.");
        }
      }
    })();
    return () => { active = false; };
  }, [retry]);

  const setLibrary = useCallback((change: SetStateAction<Library>) => {
    if (!session.current) return;
    void session.current.change((value) => typeof change === "function" ? change(value) : change)
      .catch(() => {});
  }, []);
  const commit = useCallback(async (change: (value: Library) => Library) => {
    if (!session.current) throw new Error("Storage is not ready. Please retry loading.");
    await session.current.change(change, true);
  }, []);

  return {
    library, setLibrary, ready, error, saved, commit,
    retry: () => setRetry((n) => n + 1),
    retrySave: () => { void session.current?.retry().catch(() => {}); },
  };
}
