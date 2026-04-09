import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Play, Pause, SkipBack, SkipForward,
  Repeat, Repeat1, Shuffle, Music,
  Trash2, ListMusic, Upload, X, ChevronRight,
  MoreVertical, Users, FolderPlus, Share2
} from 'lucide-react';
import { musicDB } from '../utils/musicDB';
import type { StoredSong } from '../utils/musicDB';
import type { Persona } from '../types';
import * as mmb from 'music-metadata-browser';

// --- Types ---
interface SongMeta {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string | null;
  addedAt: number;
}

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
}

type TabType = 'songs' | 'playlists' | 'nowplaying';
type LoopMode = 'sequential' | 'single' | 'shuffle';

// --- Helpers ---
function generateGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40 + Math.abs((hash >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 55%), hsl(${h2}, 60%, 40%))`;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function loadPlaylists(): Playlist[] {
  try {
    const saved = localStorage.getItem('music_playlists');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function savePlaylists(playlists: Playlist[]) {
  localStorage.setItem('music_playlists', JSON.stringify(playlists));
}

function loadLoopMode(): LoopMode {
  return (localStorage.getItem('music_loopMode') as LoopMode) || 'sequential';
}

function saveLoopMode(mode: LoopMode) {
  localStorage.setItem('music_loopMode', mode);
}

// --- Component ---
export const MusicScreen = ({
  onBack,
  time,
  contacts,
  setScreen,
  chatHistories,
  setChatHistories,
  setActiveChatContact,
}: {
  onBack: () => void;
  time: string;
  contacts?: Persona[];
  setScreen?: (screen: string) => void;
  chatHistories?: Record<string, any[]>;
  setChatHistories?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setActiveChatContact?: (contact: Persona | null) => void;
}) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('songs');
  const [songs, setSongs] = useState<SongMeta[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(loadPlaylists);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [playQueue, setPlayQueue] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopMode, setLoopMode] = useState<LoopMode>(loadLoopMode);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Playlist UI state
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [viewingPlaylistId, setViewingPlaylistId] = useState<string | null>(null);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState<string | null>(null);

  // Song menu
  const [songMenu, setSongMenu] = useState<string | null>(null);

  // Listen with
  const [showListenWith, setShowListenWith] = useState(false);

  // Progress drag
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const currentSong = useMemo(() => songs.find(s => s.id === currentSongId) || null, [songs, currentSongId]);
  const viewingPlaylist = useMemo(() => playlists.find(p => p.id === viewingPlaylistId) || null, [playlists, viewingPlaylistId]);

  // Load songs from IndexedDB on mount
  useEffect(() => {
    musicDB.getAllSongs().then(stored => {
      const metas: SongMeta[] = stored.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        coverUrl: s.coverUrl,
        addedAt: s.addedAt,
      }));
      metas.sort((a, b) => b.addedAt - a.addedAt);
      setSongs(metas);
    });
  }, []);

  // Persist playlists
  useEffect(() => {
    savePlaylists(playlists);
  }, [playlists]);

  // Persist loop mode
  useEffect(() => {
    saveLoopMode(loopMode);
  }, [loopMode]);

  // Load and play current song
  useEffect(() => {
    if (!currentSongId) return;
    let cancelled = false;

    const loadAndPlay = async () => {
      const fileBuffer = await musicDB.getSongFile(currentSongId);
      if (cancelled || !fileBuffer || !audioRef.current) return;

      // Revoke previous object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      audioRef.current.src = url;

      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    };

    loadAndPlay();

    return () => {
      cancelled = true;
    };
  }, [currentSongId]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isDragging]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    if (loopMode === 'single') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    // Play next
    const queue = playQueue;
    if (queue.length === 0) return;
    const idx = queue.indexOf(currentSongId || '');
    let nextIdx: number;

    if (loopMode === 'shuffle') {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = idx < queue.length - 1 ? idx + 1 : 0;
    }

    setCurrentSongId(queue[nextIdx]);
    setIsPlaying(true);
  }, [loopMode, playQueue, currentSongId]);

  // Play controls
  const playSong = useCallback((songId: string, queue?: string[]) => {
    if (queue) {
      setPlayQueue(queue);
    } else if (playQueue.length === 0 || !playQueue.includes(songId)) {
      // Default queue is all songs
      setPlayQueue(songs.map(s => s.id));
    }
    setCurrentSongId(songId);
    setIsPlaying(true);
    // Will actually play when useEffect loads the audio
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 300);
  }, [songs, playQueue]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong && songs.length > 0) {
      playSong(songs[0].id, songs.map(s => s.id));
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, currentSong, songs, playSong]);

  const playNext = useCallback(() => {
    if (playQueue.length === 0) return;
    const idx = playQueue.indexOf(currentSongId || '');
    let nextIdx: number;

    if (loopMode === 'shuffle') {
      nextIdx = Math.floor(Math.random() * playQueue.length);
    } else {
      nextIdx = idx < playQueue.length - 1 ? idx + 1 : 0;
    }

    setCurrentSongId(playQueue[nextIdx]);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 300);
  }, [playQueue, currentSongId, loopMode]);

  const playPrev = useCallback(() => {
    if (playQueue.length === 0) return;
    const idx = playQueue.indexOf(currentSongId || '');
    let prevIdx: number;

    if (loopMode === 'shuffle') {
      prevIdx = Math.floor(Math.random() * playQueue.length);
    } else {
      prevIdx = idx > 0 ? idx - 1 : playQueue.length - 1;
    }

    setCurrentSongId(playQueue[prevIdx]);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 300);
  }, [playQueue, currentSongId, loopMode]);

  // Progress bar interaction
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }, [duration]);

  const handleProgressDrag = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }, [duration]);

  const cycleLoopMode = useCallback(() => {
    setLoopMode(prev => {
      const modes: LoopMode[] = ['sequential', 'single', 'shuffle'];
      const idx = modes.indexOf(prev);
      return modes[(idx + 1) % modes.length];
    });
  }, []);

  // File upload handler
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newSongs: SongMeta[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`正在处理 ${i + 1}/${files.length}: ${file.name}`);

      try {
        const songId = `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const arrayBuffer = await file.arrayBuffer();

        // Parse metadata with music-metadata-browser
        let title = file.name.replace(/\.(mp3|m4a|flac|wav|ogg)$/i, '');
        let artist = '未知歌手';
        let album = '未知专辑';
        let songDuration = 0;
        let coverUrl: string | null = null;

        try {
          const metadata = await mmb.parseBlob(file);
          if (metadata.common.title) title = metadata.common.title;
          if (metadata.common.artist) artist = metadata.common.artist;
          if (metadata.common.album) album = metadata.common.album;
          if (metadata.format.duration) songDuration = metadata.format.duration;

          // Extract cover art
          if (metadata.common.picture && metadata.common.picture.length > 0) {
            const pic = metadata.common.picture[0];
            const base64 = btoa(
              new Uint8Array(pic.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            coverUrl = `data:${pic.format};base64,${base64}`;
          }
        } catch (metaErr) {
          console.warn('Failed to parse metadata for', file.name, metaErr);
        }

        // Save to IndexedDB
        await musicDB.saveSong({
          id: songId,
          title,
          artist,
          album,
          duration: songDuration,
          coverUrl,
          file: arrayBuffer,
          addedAt: Date.now(),
        });

        newSongs.push({
          id: songId,
          title,
          artist,
          album,
          duration: songDuration,
          coverUrl,
          addedAt: Date.now(),
        });
      } catch (err) {
        console.error('Failed to process file:', file.name, err);
      }
    }

    setSongs(prev => [...newSongs, ...prev]);
    setIsUploading(false);
    setUploadProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Delete song
  const handleDeleteSong = useCallback(async (songId: string) => {
    await musicDB.deleteSong(songId);
    setSongs(prev => prev.filter(s => s.id !== songId));
    setPlaylists(prev => prev.map(p => ({
      ...p,
      songIds: p.songIds.filter(id => id !== songId),
    })));
    if (currentSongId === songId) {
      setCurrentSongId(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
    setPlayQueue(prev => prev.filter(id => id !== songId));
    setSongMenu(null);
  }, [currentSongId]);

  // Playlist management
  const createPlaylist = useCallback((name: string) => {
    const newPl: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      songIds: [],
      createdAt: Date.now(),
    };
    setPlaylists(prev => [...prev, newPl]);
    setNewPlaylistName('');
    setShowNewPlaylistModal(false);
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (viewingPlaylistId === playlistId) {
      setViewingPlaylistId(null);
    }
  }, [viewingPlaylistId]);

  const addSongToPlaylist = useCallback((songId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.songIds.includes(songId)) {
        return { ...p, songIds: [...p.songIds, songId] };
      }
      return p;
    }));
    setShowAddToPlaylistModal(null);
    setSongMenu(null);
  }, []);

  const removeSongFromPlaylist = useCallback((songId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, songIds: p.songIds.filter(id => id !== songId) };
      }
      return p;
    }));
  }, []);

  // Listen with char
  const handleListenWith = useCallback((contact: Persona) => {
    if (!currentSong || !setScreen || !setChatHistories || !setActiveChatContact) return;
    const msgContent = `我在听「${currentSong.title}」，要一起听吗？`;
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      role: 'user' as const,
      content: msgContent,
      timestamp: Date.now(),
    };
    setChatHistories(prev => ({
      ...prev,
      [contact.id]: [...(prev[contact.id] || []), newMsg],
    }));
    setActiveChatContact(contact);
    setScreen('ai-chat');
    setShowListenWith(false);
  }, [currentSong, setScreen, setChatHistories, setActiveChatContact]);

  // Playlist detail songs
  const playlistSongs = useMemo(() => {
    if (!viewingPlaylist) return [];
    return viewingPlaylist.songIds
      .map(id => songs.find(s => s.id === id))
      .filter(Boolean) as SongMeta[];
  }, [viewingPlaylist, songs]);

  // Song cover component
  const SongCover = ({ song, size = 48, className = '' }: { song: SongMeta | null; size?: number; className?: string }) => {
    if (song?.coverUrl) {
      return (
        <div className={`rounded-xl overflow-hidden flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div
        className={`rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: song ? generateGradient(song.id) : 'linear-gradient(135deg, #666, #333)',
        }}
      >
        <Music size={size * 0.4} className="text-white/80" strokeWidth={1.5} />
      </div>
    );
  };

  // Loop mode display
  const LoopIcon = () => {
    if (loopMode === 'single') return <Repeat1 size={22} className="text-zinc-800 dark:text-zinc-200" />;
    if (loopMode === 'shuffle') return <Shuffle size={22} className="text-zinc-800 dark:text-zinc-200" />;
    return <Repeat size={22} className="text-zinc-500 dark:text-zinc-400" />;
  };

  const loopLabel = loopMode === 'single' ? '单曲循环' : loopMode === 'shuffle' ? '随机播放' : '顺序播放';

  // Song row component
  const SongRow = ({ song, showRemove, playlistId }: { song: SongMeta; showRemove?: boolean; playlistId?: string }) => (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer active:scale-[0.98] relative ${
        song.id === currentSongId
          ? 'bg-zinc-100 dark:bg-zinc-800'
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
      }`}
      onClick={() => {
        if (playlistId && viewingPlaylist) {
          playSong(song.id, viewingPlaylist.songIds);
        } else {
          playSong(song.id, songs.map(s => s.id));
        }
      }}
    >
      {/* Playing indicator or cover */}
      <div className="relative">
        <SongCover song={song} size={44} />
        {song.id === currentSongId && isPlaying && (
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-[2px]">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-white"
                  animate={{ height: [4, 14, 4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${
          song.id === currentSongId ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-200'
        }`}>
          {song.title}
        </p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
          {song.artist}
          {song.duration > 0 && ` · ${formatTime(song.duration)}`}
        </p>
      </div>

      {showRemove && playlistId ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeSongFromPlaylist(song.id, playlistId);
          }}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSongMenu(songMenu === song.id ? null : song.id);
          }}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-500"
        >
          <MoreVertical size={16} />
        </button>
      )}

      {/* Song context menu */}
      <AnimatePresence>
        {songMenu === song.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-12 top-2 z-30 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 overflow-hidden min-w-[130px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowAddToPlaylistModal(song.id);
                setSongMenu(null);
              }}
              className="w-full px-4 py-2.5 text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
            >
              <ListMusic size={14} /> 加入歌单
            </button>
            <div className="h-px bg-zinc-100 dark:bg-zinc-700" />
            <button
              onClick={() => handleDeleteSong(song.id)}
              className="w-full px-4 py-2.5 text-xs text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 size={14} /> 删除
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div
      key="app-music"
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      exit={{ x: 0 }}
      transition={{ duration: 0 }}
      className="absolute inset-0 bg-neutral-50 dark:bg-black flex flex-col z-50"
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.m4a,.flac,.wav,.ogg"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />


      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white dark:bg-[#1c1c1e] border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (viewingPlaylistId) {
                setViewingPlaylistId(null);
                setActiveTab('playlists');
              } else {
                onBack();
              }
            }}
            className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 w-10 h-10 flex items-center justify-center -ml-1 transition-colors"
          >
            <ArrowLeft size={22} strokeWidth={1.5} />
          </button>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
            {viewingPlaylistId ? (viewingPlaylist?.name || '歌单') : '音乐'}
          </h2>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <Upload size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Tabs - only show when not viewing a playlist */}
      {!viewingPlaylistId && (
        <div className="flex bg-white dark:bg-[#1c1c1e] border-b border-zinc-100 dark:border-zinc-800">
          {([
            { key: 'songs' as TabType, label: '歌曲' },
            { key: 'playlists' as TabType, label: '歌单' },
            { key: 'nowplaying' as TabType, label: '正在播放' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab.key
                  ? 'text-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="music-tab-indicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-zinc-800 dark:bg-zinc-200 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <div className={`flex-1 overflow-y-auto ${currentSong ? 'pb-[90px]' : 'pb-6'}`}>

        {/* ========== Playlist Detail View ========== */}
        {viewingPlaylistId && viewingPlaylist && (
          <div className="px-4 pt-4">
            {/* Playlist header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: generateGradient(viewingPlaylist.id) }}
              >
                <ListMusic size={32} className="text-white/90" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{viewingPlaylist.name}</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{viewingPlaylist.songIds.length} 首歌曲</p>
              </div>
              <button
                onClick={() => deletePlaylist(viewingPlaylist.id)}
                className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Play all */}
            {playlistSongs.length > 0 && (
              <button
                onClick={() => {
                  if (playlistSongs.length > 0) {
                    playSong(playlistSongs[0].id, viewingPlaylist.songIds);
                  }
                }}
                className="w-full mb-4 py-3 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Play size={16} fill="currentColor" /> 播放全部
              </button>
            )}

            {playlistSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500 gap-3">
                <Music size={40} strokeWidth={1} />
                <p className="text-xs font-semibold">歌单暂无歌曲</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {playlistSongs.map(song => (
                  <SongRow key={song.id} song={song} showRemove playlistId={viewingPlaylist.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== Songs Tab ========== */}
        {!viewingPlaylistId && activeTab === 'songs' && (
          <div className="px-4 pt-4">
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mb-4 py-3.5 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors active:scale-[0.98]"
            >
              <Upload size={18} />
              添加音乐
            </button>

            {/* Upload progress */}
            {isUploading && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">{uploadProgress}</p>
                </div>
              </div>
            )}

            {/* Songs list */}
            {songs.length === 0 && !isUploading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 gap-3">
                <Music size={48} strokeWidth={1} />
                <p className="text-sm font-semibold">暂无歌曲</p>
                <p className="text-xs">点击上方按钮添加本地音乐文件</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {songs.map(song => (
                  <SongRow key={song.id} song={song} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== Playlists Tab ========== */}
        {!viewingPlaylistId && activeTab === 'playlists' && (
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
                我的歌单 ({playlists.length})
              </span>
              <button
                onClick={() => setShowNewPlaylistModal(true)}
                className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <Plus size={14} />
                <span>新建歌单</span>
              </button>
            </div>

            {playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 gap-3">
                <FolderPlus size={48} strokeWidth={1} />
                <p className="text-sm font-semibold">暂无歌单</p>
                <p className="text-xs">点击右上角创建新歌单</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {playlists.map(pl => {
                  const plSongCount = pl.songIds.filter(id => songs.some(s => s.id === id)).length;
                  return (
                    <button
                      key={pl.id}
                      onClick={() => setViewingPlaylistId(pl.id)}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 active:scale-[0.98] transition-all text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: generateGradient(pl.id) }}
                      >
                        <ListMusic size={20} className="text-white/90" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{pl.name}</p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{plSongCount} 首歌曲</p>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== Now Playing Tab ========== */}
        {!viewingPlaylistId && activeTab === 'nowplaying' && (
          <div className="px-6 pt-6 flex flex-col items-center">
            {!currentSong ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 gap-3">
                <Music size={48} strokeWidth={1} />
                <p className="text-sm font-semibold">暂无播放</p>
                <p className="text-xs">选择一首歌曲开始播放</p>
              </div>
            ) : (
              <>
                {/* Large cover */}
                <div className="w-full max-w-[280px] aspect-square mb-8 mt-4">
                  {currentSong.coverUrl ? (
                    <div className={`w-full h-full rounded-3xl overflow-hidden shadow-2xl ${isPlaying ? 'animate-spin-slow' : ''}`}>
                      <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div
                      className={`w-full h-full rounded-3xl flex items-center justify-center shadow-2xl ${isPlaying ? 'animate-spin-slow' : ''}`}
                      style={{ background: generateGradient(currentSong.id) }}
                    >
                      <Music size={80} className="text-white/60" strokeWidth={1} />
                    </div>
                  )}
                </div>

                {/* Song info */}
                <div className="w-full text-center mb-6">
                  <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 truncate">{currentSong.title}</h3>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 truncate">{currentSong.artist}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full mb-2">
                  <div
                    ref={progressRef}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full cursor-pointer relative group"
                    onClick={handleProgressClick}
                    onTouchMove={handleProgressDrag}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                  >
                    <div
                      className="absolute left-0 top-0 h-full bg-zinc-600 dark:bg-zinc-300 rounded-full transition-[width] duration-100"
                      style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                    />
                    {/* Drag handle */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-700 dark:bg-zinc-200 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 8px)` : '0' }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-8 mb-6">
                  <button
                    onClick={playPrev}
                    className="w-12 h-12 flex items-center justify-center text-zinc-600 dark:text-zinc-300 active:scale-90 transition-transform"
                  >
                    <SkipBack size={24} fill="currentColor" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 flex items-center justify-center bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-full active:scale-90 transition-transform shadow-lg"
                  >
                    {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
                  </button>
                  <button
                    onClick={playNext}
                    className="w-12 h-12 flex items-center justify-center text-zinc-600 dark:text-zinc-300 active:scale-90 transition-transform"
                  >
                    <SkipForward size={24} fill="currentColor" />
                  </button>
                </div>

                {/* Loop mode */}
                <button
                  onClick={cycleLoopMode}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 active:scale-95 transition-all mb-6"
                >
                  <LoopIcon />
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{loopLabel}</span>
                </button>

                {/* Share with char button */}
                {contacts && contacts.length > 0 && (
                  <button
                    onClick={() => setShowListenWith(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl active:scale-95 transition-all"
                  >
                    <Share2 size={16} className="text-zinc-500 dark:text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                      和{contacts[0]?.chatName || '好友'}分享这首歌
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ========== Bottom Player Bar ========== */}
      {currentSong && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200/60 dark:border-zinc-800 z-40">
          {/* Progress bar thin line */}
          <div className="w-full h-[3px] bg-zinc-200 dark:bg-zinc-700 relative">
            <div
              className="absolute left-0 top-0 h-full bg-zinc-600 dark:bg-zinc-300 rounded-r-full transition-[width] duration-200"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>

          <div className="px-4 py-3 flex items-center gap-3">
            {/* Left: cover + info - click to go to now playing */}
            <div
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => {
                if (viewingPlaylistId) setViewingPlaylistId(null);
                setActiveTab('nowplaying');
              }}
            >
              <SongCover song={currentSong} size={44} className={isPlaying ? 'animate-spin-slow' : ''} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{currentSong.title}</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{currentSong.artist}</p>
              </div>
            </div>

            {/* Center: play/pause */}
            <button
              onClick={togglePlay}
              className="w-11 h-11 flex items-center justify-center bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-full active:scale-90 transition-transform shadow-sm"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            {/* Right: next */}
            <button
              onClick={playNext}
              className="w-9 h-9 flex items-center justify-center text-zinc-600 dark:text-zinc-300 active:scale-90 transition-transform"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      {/* ===== Modals ===== */}

      {/* Add to playlist modal */}
      <AnimatePresence>
        {showAddToPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/40 flex items-end justify-center"
            onClick={() => setShowAddToPlaylistModal(null)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-10 max-h-[60%] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4">加入歌单</h3>

              {playlists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">暂无歌单</p>
                  <button
                    onClick={() => {
                      setShowAddToPlaylistModal(null);
                      setShowNewPlaylistModal(true);
                    }}
                    className="px-4 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-xl text-sm font-bold"
                  >
                    创建歌单
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {playlists.map(pl => {
                    const alreadyIn = pl.songIds.includes(showAddToPlaylistModal);
                    return (
                      <button
                        key={pl.id}
                        disabled={alreadyIn}
                        onClick={() => addSongToPlaylist(showAddToPlaylistModal, pl.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                          alreadyIn
                            ? 'opacity-50 bg-zinc-50 dark:bg-zinc-800/50'
                            : 'bg-zinc-50 dark:bg-zinc-800 active:scale-[0.98]'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: generateGradient(pl.id) }}
                        >
                          <ListMusic size={16} className="text-white/90" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex-1 text-left">{pl.name}</span>
                        {alreadyIn && <span className="text-[10px] text-zinc-400">已添加</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New playlist modal */}
      <AnimatePresence>
        {showNewPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/40 flex items-center justify-center px-6"
            onClick={() => setShowNewPlaylistModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4">新建歌单</h3>
              <input
                type="text"
                placeholder="歌单名称"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPlaylistName.trim()) {
                    createPlaylist(newPlaylistName.trim());
                  }
                }}
                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 outline-none border border-zinc-200 dark:border-zinc-700 placeholder:text-zinc-400"
                autoFocus
              />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowNewPlaylistModal(false)}
                  className="flex-1 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-semibold active:scale-95 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => newPlaylistName.trim() && createPlaylist(newPlaylistName.trim())}
                  disabled={!newPlaylistName.trim()}
                  className="flex-1 h-11 rounded-xl bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 text-sm font-bold active:scale-95 transition-all disabled:opacity-40"
                >
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listen with char modal */}
      <AnimatePresence>
        {showListenWith && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/40 flex items-end justify-center"
            onClick={() => setShowListenWith(false)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-10 max-h-[60%] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4">和谁一起听？</h3>
              {contacts && contacts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {contacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleListenWith(contact)}
                      className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl active:scale-[0.98] transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {contact.avatar ? (
                          <img src={contact.avatar} alt={contact.chatName} className="w-full h-full object-cover" />
                        ) : (
                          <Users size={18} className="text-zinc-400" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex-1 text-left">{contact.chatName}</span>
                      <ChevronRight size={16} className="text-zinc-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-8">暂无联系人</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close song menu */}
      {songMenu && (
        <div className="absolute inset-0 z-[29]" onClick={() => setSongMenu(null)} />
      )}

      {/* Slow spin animation style */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
          border-radius: 50%;
        }
      `}</style>
    </motion.div>
  );
};
