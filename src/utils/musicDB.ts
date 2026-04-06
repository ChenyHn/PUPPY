import { openDB } from 'idb';

const DB_NAME = 'musicDB';
const STORE_NAME = 'songs';

export interface StoredSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string | null;
  file: ArrayBuffer;
  addedAt: number;
}

export const musicDB = {
  async init() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  },
  async saveSong(song: StoredSong) {
    const db = await this.init();
    await db.put(STORE_NAME, song);
  },
  async getAllSongs(): Promise<StoredSong[]> {
    const db = await this.init();
    return db.getAll(STORE_NAME);
  },
  async deleteSong(id: string) {
    const db = await this.init();
    await db.delete(STORE_NAME, id);
  },
  async getSong(id: string): Promise<StoredSong | undefined> {
    const db = await this.init();
    return db.get(STORE_NAME, id);
  },
  async getSongFile(id: string): Promise<ArrayBuffer | undefined> {
    const db = await this.init();
    const song = await db.get(STORE_NAME, id);
    return song?.file;
  },
};
