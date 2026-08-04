import { speechRecognitionService } from "./speech-recognition.service.js";
import { speechSynthesisService } from "./speech-synthesis.service.js";
import type {
  TranscribeOptions,
  TranscribeResponse,
  SynthesizeOptions,
} from "./voice.types.js";
import { logger } from "../../lib/logger.js";

export class VoiceService {
  public async transcribeAudio(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscribeResponse> {
    const startTime = performance.now();

    const result = await speechRecognitionService.transcribe(
      audioBuffer,
      options,
    );

    const transcriptionTimeMs = Math.round(performance.now() - startTime);

    logger.info("Voice Service Transcribe Completed", {
      transcriptionTimeMs,
      provider: speechRecognitionService.providerName,
      textLength: result.text.length,
    });

    return {
      text: result.text,
      metrics: {
        transcriptionTimeMs,
        provider: speechRecognitionService.providerName,
      },
    };
  }

  public async generateSpeech(
    text: string,
    options?: SynthesizeOptions,
  ): Promise<{ audioBuffer: Buffer; speechGenerationTimeMs: number }> {
    const startTime = performance.now();

    const audioBuffer = await speechSynthesisService.synthesize(text, options);

    const speechGenerationTimeMs = Math.round(performance.now() - startTime);

    logger.info("Voice Service Speech Generation Completed", {
      speechGenerationTimeMs,
      provider: speechSynthesisService.providerName,
      bufferSizeBytes: audioBuffer.length,
    });

    return {
      audioBuffer,
      speechGenerationTimeMs,
    };
  }
}

export const voiceService = new VoiceService();
