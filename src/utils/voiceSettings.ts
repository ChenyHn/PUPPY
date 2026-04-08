export interface MiniMaxCredentials {
  apiKey: string;
  groupId: string;
}

export interface VoicePreference {
  mode: 'preset' | 'custom';
  voiceId: string;
}

export const PRESET_VOICES = [
  { id: 'female-tianmei', name: '温柔女声 (天美)' },
  { id: 'male-qn-qingse', name: '清爽男声 (青涩)' },
  { id: 'female-yujie', name: '知性姐姐 (御姐)' }
];

const CREDS_KEY = 'puppy_minimax_creds';
const PREF_KEY = 'puppy_voice_pref';

export function getCredentials(): MiniMaxCredentials | null {
  const data = localStorage.getItem(CREDS_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveCredentials(data: MiniMaxCredentials): void {
  localStorage.setItem(CREDS_KEY, JSON.stringify(data));
}

export function getVoicePreference(): VoicePreference {
  const data = localStorage.getItem(PREF_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  // Default preference
  return {
    mode: 'preset',
    voiceId: 'female-tianmei'
  };
}

export function saveVoicePreference(data: VoicePreference): void {
  localStorage.setItem(PREF_KEY, JSON.stringify(data));
}
