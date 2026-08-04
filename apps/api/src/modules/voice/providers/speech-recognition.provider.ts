import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { promisify } from "util";
import { env } from "../../../config/env.js";
import { logger } from "../../../lib/logger.js";
import type {
  SpeechRecognitionProvider,
  TranscribeOptions,
  TranscribeResult,
} from "../voice.types.js";

const execFileAsync = promisify(execFile);

export class WhisperCppProvider implements SpeechRecognitionProvider {
  public readonly name = "Whisper.cpp (Local STT)";

  private whisperPath: string;
  private defaultModel: string;

  public constructor(whisperPath?: string, defaultModel?: string) {
    this.whisperPath = whisperPath ?? env.WHISPER_PATH;
    this.defaultModel = defaultModel ?? env.WHISPER_MODEL;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync(this.whisperPath, ["--help"]);
      return true;
    } catch {
      return false;
    }
  }

  public async transcribe(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscribeResult> {
    const tempId = `stt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tempAudioPath = path.join(os.tmpdir(), `${tempId}.webm`);
    const model = options?.model ?? this.defaultModel;
    const language = options?.language ?? "en";

    try {
      await fs.writeFile(tempAudioPath, audioBuffer);

      // Call whisper binary
      const args = [
        tempAudioPath,
        "--model",
        model,
        "--language",
        language,
        "--output-format",
        "txt",
      ];

      logger.info("Executing Whisper.cpp STT", {
        tempAudioPath,
        model,
        language,
      });

      const { stdout } = await execFileAsync(this.whisperPath, args, {
        timeout: 60_000,
      });

      const text = stdout.trim();
      return {
        text: text || "Voice transcript empty.",
        language,
        confidence: 0.95,
      };
    } catch (error) {
      logger.warn("Whisper.cpp STT execution unavailable or failed, using fallback", {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        text: "Offline Whisper.cpp is not installed or available on this host.",
        language: "en",
        confidence: 0.5,
      };
    } finally {
      // Clean up temporary audio file
      fs.unlink(tempAudioPath).catch(() => {});
    }
  }
}
