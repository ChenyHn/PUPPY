import { getCredentials, getVoicePreference } from './voiceSettings';

export async function textToSpeech(text: string): Promise<string | null> {
  const creds = getCredentials();
  if (!creds || !creds.apiKey || !creds.groupId) {
    console.warn('MiniMax credentials not configured.');
    return null;
  }

  const pref = getVoicePreference();
  const voiceId = pref.voiceId || 'female-tianmei';

  try {
    const response = await fetch(`https://api.minimax.chat/v1/text_to_speech?GroupId=${creds.groupId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'speech-01',
        text: text,
        voice_id: voiceId,
        format: 'mp3',
        speed: 1.0,
        vol: 1.0,
        pitch: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('MiniMax TTS Error:', errorData);
      throw new Error(`TTS API failed with status ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to call MiniMax TTS:', error);
    return null;
  }
}

// 预留实时语音功能
export async function initializeRealtime(): Promise<void> {
  console.log('Realtime voice call initialization placeholder.');
  // To be implemented
}
