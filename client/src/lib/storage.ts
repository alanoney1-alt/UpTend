export async function uploadToObjectStorage(file: File): Promise<string> {
  // Placeholder - returns a local object URL for dev mode
  return URL.createObjectURL(file);
}

export const storage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};

export default storage;
