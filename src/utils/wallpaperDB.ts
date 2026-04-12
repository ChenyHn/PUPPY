import { openDB } from 'idb';

const DB_NAME = 'wallpaperDB';
const STORE_NAME = 'wallpaper';
const DESKTOP_WALLPAPER_ID = 'desktop-wallpaper';

export interface StoredWallpaper {
  id: string;
  blob: Blob;
  mimeType: string;
  updatedAt: number;
}

export const wallpaperDB = {
  async init() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  },
  async saveWallpaper(blob: Blob, mimeType: string = blob.type || 'image/jpeg') {
    const db = await this.init();
    const wallpaper: StoredWallpaper = {
      id: DESKTOP_WALLPAPER_ID,
      blob,
      mimeType,
      updatedAt: Date.now(),
    };
    await db.put(STORE_NAME, wallpaper);
  },
  async getWallpaper(): Promise<StoredWallpaper | undefined> {
    const db = await this.init();
    return db.get(STORE_NAME, DESKTOP_WALLPAPER_ID);
  },
  async deleteWallpaper() {
    const db = await this.init();
    await db.delete(STORE_NAME, DESKTOP_WALLPAPER_ID);
  },
};
