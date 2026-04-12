import { useCallback, useEffect, useRef, useState } from 'react';
import { wallpaperDB } from '../utils/wallpaperDB';
import type { IconStyleConfig } from '../types';

const MAX_STORED_IMAGE_LENGTH = 1_200_000;
const MAX_WALLPAPER_IMAGE_LENGTH = 900_000;
const WALLPAPER_STORAGE_KEY = 'aiphone_wallpaper';

export const isPersistedImageSource = (value: string | null | undefined, maxLength: number = MAX_STORED_IMAGE_LENGTH) => {
  if (!value || typeof value !== 'string') return false;
  if (/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value)) {
    return value.length <= maxLength;
  }
  return /^https?:\/\//i.test(value);
};

export const isRuntimeImageSource = (value: string | null | undefined, maxLength: number = MAX_STORED_IMAGE_LENGTH) => {
  if (!value || typeof value !== 'string') return false;
  if (/^blob:/i.test(value)) return true;
  return isPersistedImageSource(value, maxLength);
};

export const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.8, maxLength: number = MAX_STORED_IMAGE_LENGTH): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          if (compressed.length > maxLength) {
            reject(new Error('Image too large after compression'));
            return;
          }
          resolve(compressed);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
};

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const compressImageToBlob = (file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas export failed'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          quality,
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
};

const compressWallpaperToFit = async (file: File): Promise<Blob> => {
  const attempts = [
    { maxWidth: 1200, quality: 0.82 },
    { maxWidth: 1080, quality: 0.76 },
    { maxWidth: 960, quality: 0.7 },
    { maxWidth: 840, quality: 0.64 },
  ];

  for (const attempt of attempts) {
    const blob = await compressImageToBlob(file, attempt.maxWidth, attempt.quality);
    if (blob.size <= 3 * 1024 * 1024) {
      return blob;
    }
  }

  throw new Error('Wallpaper image still too large after multiple compression attempts');
};

const validateImageSource = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error('Image validation failed'));
    img.src = src;
  });
};

const validateWallpaperBlob = async (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  try {
    await validateImageSource(url);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
};

export function useAppSettings() {
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('aiphone_theme_mode') as 'system' | 'light' | 'dark') || 'system';
  });
  const [isLockScreenEnabled, setIsLockScreenEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('aiphone_lock_screen_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isPasswordEnabled, setIsPasswordEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('aiphone_password_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showStatusBar, setShowStatusBar] = useState<boolean>(() => {
    const saved = localStorage.getItem('aiphone_show_status_bar');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [motto, setMotto] = useState(() => localStorage.getItem('aiphone_motto') || '生活明朗，万物可爱');
  const [fontLink, setFontLink] = useState(() => localStorage.getItem('aiphone_font_link') || '');
  const [customIcons, setCustomIcons] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('aiphone_custom_icons');
    return saved ? JSON.parse(saved) : {};
  });
  const [iconStyleConfig, setIconStyleConfig] = useState<IconStyleConfig>(() => {
    const saved = localStorage.getItem('aiphone_icon_style_config');
    return saved ? JSON.parse(saved) : {
      isEnabled: true,
      borderRadius: 20,
      iconSize: 60,
      bgOpacity: 0.2,
      bgLightColor: '#ffffff',
      bgDarkColor: '#000000',
      shadowIntensity: 0.05,
      iconLightColor: '#27272a',
      iconDarkColor: '#f4f4f5'
    };
  });
  const [frostIntensity, setFrostIntensity] = useState<number>(() => {
    const saved = localStorage.getItem('aiphone_frost_intensity');
    return saved !== null ? Number(saved) : 60;
  });
  const [iconFrostIntensity, setIconFrostIntensity] = useState<number>(() => {
    const saved = localStorage.getItem('iconFrostIntensity');
    return saved !== null ? Number(saved) : 60;
  });
  const [componentBgOpacity, setComponentBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('componentBgOpacity');
    return saved !== null ? Number(saved) : 0.3;
  });
  const [baseFontSize, setBaseFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('aiphone_font_size');
    return saved !== null ? Number(saved) : 16;
  });
  const [baseFontColor, setBaseFontColor] = useState<string>(() => {
    return localStorage.getItem('aiphone_font_color') || '';
  });

  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const wallpaperObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (mode: string) => {
      if (mode === 'dark') {
        root.classList.add('dark');
      } else if (mode === 'light') {
        root.classList.remove('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(themeMode);
    localStorage.setItem('aiphone_theme_mode', themeMode);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (themeMode === 'system') applyTheme('system');
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [themeMode]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedIconFrost = localStorage.getItem('iconFrostIntensity');
      if (savedIconFrost !== null) {
        setIconFrostIntensity(Number(savedIconFrost));
      }

      const savedOpacity = localStorage.getItem('componentBgOpacity');
      if (savedOpacity !== null) {
        setComponentBgOpacity(Number(savedOpacity));
      }

      const savedStatusBar = localStorage.getItem('aiphone_show_status_bar');
      if (savedStatusBar !== null) {
        setShowStatusBar(JSON.parse(savedStatusBar));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 200);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('aiphone_font_link', fontLink);
    if (fontLink) {
      const id = 'custom-font-style';
      let link = document.getElementById(id) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = fontLink;

      const match = fontLink.match(/family=([^&:]+)/);
      if (match) {
        const family = match[1].replace(/\+/g, ' ');
        document.documentElement.style.setProperty('--custom-font-family', `"${family}", sans-serif`);
      }
    } else {
      document.documentElement.style.removeProperty('--custom-font-family');
    }
  }, [fontLink]);

  useEffect(() => {
    localStorage.setItem('aiphone_custom_icons', JSON.stringify(customIcons));
  }, [customIcons]);

  useEffect(() => {
    localStorage.setItem('aiphone_icon_style_config', JSON.stringify(iconStyleConfig));
  }, [iconStyleConfig]);

  useEffect(() => {
    localStorage.setItem('aiphone_frost_intensity', frostIntensity.toString());
  }, [frostIntensity]);

  useEffect(() => {
    localStorage.setItem('iconFrostIntensity', iconFrostIntensity.toString());
  }, [iconFrostIntensity]);

  useEffect(() => {
    localStorage.setItem('aiphone_font_size', baseFontSize.toString());
    document.documentElement.style.setProperty('--base-font-size', `${baseFontSize}px`);
  }, [baseFontSize]);

  useEffect(() => {
    localStorage.setItem('aiphone_font_color', baseFontColor);
    if (baseFontColor) {
      document.documentElement.style.setProperty('--base-font-color', baseFontColor);
      document.documentElement.classList.add('custom-font-color');
    } else {
      document.documentElement.style.removeProperty('--base-font-color');
      document.documentElement.classList.remove('custom-font-color');
    }
  }, [baseFontColor]);

  useEffect(() => {
    localStorage.setItem('aiphone_lock_screen_enabled', JSON.stringify(isLockScreenEnabled));
  }, [isLockScreenEnabled]);

  useEffect(() => {
    localStorage.setItem('aiphone_password_enabled', JSON.stringify(isPasswordEnabled));
  }, [isPasswordEnabled]);

  useEffect(() => {
    localStorage.setItem('aiphone_show_status_bar', JSON.stringify(showStatusBar));
  }, [showStatusBar]);

  useEffect(() => {
    localStorage.setItem('aiphone_motto', motto);
  }, [motto]);

  const revokeWallpaperObjectUrl = useCallback(() => {
    if (wallpaperObjectUrlRef.current) {
      URL.revokeObjectURL(wallpaperObjectUrlRef.current);
      wallpaperObjectUrlRef.current = null;
    }
  }, []);

  const createWallpaperObjectUrl = useCallback((blob: Blob) => {
    revokeWallpaperObjectUrl();
    const url = URL.createObjectURL(blob);
    wallpaperObjectUrlRef.current = url;
    return url;
  }, [revokeWallpaperObjectUrl]);

  const hydrateWallpaper = useCallback(async () => {
    try {
      const storedWallpaper = await wallpaperDB.getWallpaper();
      if (storedWallpaper?.blob) {
        const url = createWallpaperObjectUrl(storedWallpaper.blob);
        setWallpaper(url);
        return url;
      }

      const legacyWallpaper = localStorage.getItem(WALLPAPER_STORAGE_KEY);
      if (!isPersistedImageSource(legacyWallpaper, MAX_WALLPAPER_IMAGE_LENGTH)) {
        if (legacyWallpaper) {
          try {
            localStorage.removeItem(WALLPAPER_STORAGE_KEY);
          } catch {}
        }
        revokeWallpaperObjectUrl();
        setWallpaper(null);
        return null;
      }

      await validateImageSource(legacyWallpaper);
      const migratedBlob = await dataUrlToBlob(legacyWallpaper);
      await wallpaperDB.saveWallpaper(migratedBlob, migratedBlob.type || 'image/jpeg');
      try {
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
      } catch {}
      const url = createWallpaperObjectUrl(migratedBlob);
      setWallpaper(url);
      return url;
    } catch (error) {
      console.error('Failed to hydrate wallpaper:', error);
      revokeWallpaperObjectUrl();
      setWallpaper(null);
      try {
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
      } catch {}
      try {
        await wallpaperDB.deleteWallpaper();
      } catch {}
      return null;
    }
  }, [createWallpaperObjectUrl, revokeWallpaperObjectUrl]);

  const updateWallpaper = useCallback(async (newUrl: string | null) => {
    if (!newUrl) {
      setWallpaper(null);
      revokeWallpaperObjectUrl();
      try {
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear legacy wallpaper:', error);
      }
      try {
        await wallpaperDB.deleteWallpaper();
      } catch (error) {
        console.error('Failed to clear wallpaper from IndexedDB:', error);
        return false;
      }
      return true;
    }

    try {
      const validated = await validateImageSource(newUrl);
      if (!isRuntimeImageSource(validated, MAX_WALLPAPER_IMAGE_LENGTH)) {
        throw new Error('Wallpaper exceeds safe runtime limit');
      }
      setWallpaper(validated);
      return true;
    } catch (error) {
      console.error('Failed to update wallpaper:', error);
      setWallpaper(null);
      revokeWallpaperObjectUrl();
      try {
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
      } catch {}
      try {
        await wallpaperDB.deleteWallpaper();
      } catch {}
      return false;
    }
  }, [revokeWallpaperObjectUrl]);

  const uploadWallpaper = useCallback(async (file: File) => {
    const previousWallpaper = wallpaper;
    try {
      const compressed = await compressWallpaperToFit(file);
      await validateWallpaperBlob(compressed);
      await wallpaperDB.saveWallpaper(compressed, compressed.type || 'image/jpeg');
      const nextWallpaperUrl = createWallpaperObjectUrl(compressed);
      const success = await updateWallpaper(nextWallpaperUrl);
      if (!success) {
        await hydrateWallpaper();
        alert('图片过大或处理失败，已恢复上一张壁纸');
      }
      return success;
    } catch (err) {
      console.error('Failed to process wallpaper:', err);
      if (previousWallpaper && isRuntimeImageSource(previousWallpaper, MAX_WALLPAPER_IMAGE_LENGTH)) {
        setWallpaper(previousWallpaper);
      } else {
        await updateWallpaper(null);
      }
      const message = err instanceof Error && err.message.includes('too large')
        ? '图片过大，自动压缩后仍无法作为桌面壁纸'
        : '图片加载失败，已恢复默认背景';
      alert(message);
      return false;
    }
  }, [createWallpaperObjectUrl, hydrateWallpaper, updateWallpaper, wallpaper]);

  const handleWallpaperChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadWallpaper(file);
      } finally {
        e.target.value = '';
      }
    }
  }, [uploadWallpaper]);

  useEffect(() => {
    void hydrateWallpaper();
    return () => {
      revokeWallpaperObjectUrl();
    };
  }, [hydrateWallpaper, revokeWallpaperObjectUrl]);

  const safeWallpaper = wallpaper && isRuntimeImageSource(wallpaper, MAX_WALLPAPER_IMAGE_LENGTH) ? wallpaper : null;

  return {
    themeMode,
    setThemeMode,
    isLockScreenEnabled,
    setIsLockScreenEnabled,
    isPasswordEnabled,
    setIsPasswordEnabled,
    showStatusBar,
    setShowStatusBar,
    wallpaper,
    setWallpaper,
    safeWallpaper,
    motto,
    setMotto,
    fontLink,
    setFontLink,
    customIcons,
    setCustomIcons,
    iconStyleConfig,
    setIconStyleConfig,
    frostIntensity,
    setFrostIntensity,
    iconFrostIntensity,
    setIconFrostIntensity,
    componentBgOpacity,
    setComponentBgOpacity,
    baseFontSize,
    setBaseFontSize,
    baseFontColor,
    setBaseFontColor,
    wallpaperInputRef,
    updateWallpaper,
    uploadWallpaper,
    handleWallpaperChange,
    compressImage,
  };
}
