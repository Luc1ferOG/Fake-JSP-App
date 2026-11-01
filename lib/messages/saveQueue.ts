/** Serialize snapshots, recovering the queue after a rejected write. */
export function createSaveQueue(write: (value: string) => Promise<void>) {
  let pending: Promise<void> = Promise.resolve();
  return (snapshot: string) => {
    pending = pending.catch(() => {}).then(() => write(snapshot));
    return pending;
  };
}
