import type { Library } from "./model.ts";

/** Apply changes in order, always against the latest library, including contact saves. */
export function createLibrarySession(
  initial: Library,
  write: (snapshot: string) => Promise<void>,
  publish: (library: Library, saved: boolean, error: string) => void,
) {
  let current = initial;
  let pending: Promise<void> = Promise.resolve();
  function change(update: (value: Library) => Library, commit = false) {
    const operation = pending.catch(() => {}).then(async () => {
      const next = update(current);
      if (!commit) current = next;
      publish(current, false, "");
      try {
        await write(JSON.stringify(next));
        current = next;
        publish(current, true, "");
      } catch {
        const message = commit
          ? "Could not save changes. Your draft is still open. Retry saving."
          : "Changes are not saved. Storage may be full or unavailable. Retry saving.";
        publish(current, false, message);
        throw new Error(message);
      }
    });
    pending = operation;
    return operation;
  }
  return { change, retry: () => change((value) => value) };
}
