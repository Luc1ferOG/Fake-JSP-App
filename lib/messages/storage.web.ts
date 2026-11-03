// Browser storage belongs to this visitor's browser profile and this site's origin.
// Write synchronously so navigation cannot interrupt a pending storage operation.
export const libraryStorage = {
  read: async (key: string) => window.localStorage.getItem(key),
  write: async (key: string, value: string) => {
    window.localStorage.setItem(key, value);
  },
};
