import apiClient from "@/shared/lib/api-client";
import type { ApiSuccess } from "@/shared/types/api";

export interface TranscribeApiResponse {
  text: string;
  metrics: {
    transcriptionTimeMs: number;
    provider: string;
  };
}

export const offlineVoiceService = {
  async transcribeAudio(
    audioBlob: Blob,
    model = "base",
    language = "en",
  ): Promise<TranscribeApiResponse> {
    const arrayBuffer = await audioBlob.arrayBuffer();

    const response = await apiClient.post<ApiSuccess<TranscribeApiResponse>>(
      `/voice/transcribe?model=${encodeURIComponent(model)}&language=${encodeURIComponent(language)}`,
      arrayBuffer,
      {
        headers: {
          "Content-Type": audioBlob.type || "audio/webm",
        },
        timeout: 90_000,
      },
    );

    return response.data.data;
  },

  async synthesizeSpeech(
    text: string,
    voice?: string,
    rate = 1.0,
    pitch = 1.0,
  ): Promise<ArrayBuffer> {
    const response = await apiClient.post<ArrayBuffer>(
      "/voice/speak",
      { text, voice, rate, pitch },
      {
        responseType: "arraybuffer",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 90_000,
      },
    );

    return response.data;
  },
};
