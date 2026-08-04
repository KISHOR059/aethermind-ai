import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import { env } from "../../../config/env.js";
import { logger } from "../../../lib/logger.js";
import type {
  SpeechSynthesisProvider,
  SynthesizeOptions,
} from "../voice.types.js";

const execFileAsync = promisify(execFile);

export class PiperTtsProvider implements SpeechSynthesisProvider {
  public readonly name = "Piper TTS (Local TTS)";

  private piperPath: string;
  private defaultModel: string;

  public constructor(piperPath?: string, defaultModel?: string) {
    this.piperPath = piperPath ?? env.PIPER_PATH;
    this.defaultModel = defaultModel ?? env.PIPER_MODEL;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync(this.piperPath, ["--help"]);
      return true;
    } catch {
      return false;
    }
  }

  public async synthesize(
    text: string,
    options?: SynthesizeOptions,
  ): Promise<Buffer> {
    const tempId = `tts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tempWavPath = path.join(os.tmpdir(), `${tempId}.wav`);
    const model = options?.voice ?? this.defaultModel;

    try {
      logger.info("Executing Piper TTS", { textLength: text.length, model });

      await new Promise<void>((resolve, reject) => {
        const child = spawn(this.piperPath, [
          "--model",
          model,
          "--output_file",
          tempWavPath,
        ]);

        child.stdin.write(text);
        child.stdin.end();

        child.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Piper TTS exited with code ${code}`));
        });

        child.on("error", (err) => reject(err));
      });

      const wavBuffer = await fs.readFile(tempWavPath);
      return wavBuffer;
    } catch (error) {
      logger.warn("Piper TTS unavailable or failed, generating fallback WAV audio", {
        error: error instanceof Error ? error.message : String(error),
      });

      return generateFallbackWavBuffer();
    } finally {
      fs.unlink(tempWavPath).catch(() => {});
    }
  }
}

export class KokoroTtsProvider implements SpeechSynthesisProvider {
  public readonly name = "Kokoro TTS (Local Swappable TTS)";

  public async isAvailable(): Promise<boolean> {
    return false;
  }

  public async synthesize(
    text: string,
  ): Promise<Buffer> {
    logger.info("Kokoro TTS invoked", { textLength: text.length });
    return generateFallbackWavBuffer();
  }
}

/**
 * Generate a valid 44-byte WAV header with 0.5s silent/beep PCM data
 * so browser frontend audio players don't crash when local binary is absent.
 */
function generateFallbackWavBuffer(): Buffer {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const durationSeconds = 0.5;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Chunk size
  buffer.writeUInt16LE(1, 20);  // Audio format (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Silent audio sample bytes remain 0
  return buffer;
}
