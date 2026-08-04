import type { Request, Response, NextFunction } from "express";
import { voiceService } from "./voice.service.js";
import { speakRequestSchema, transcribeQuerySchema } from "./voice.validation.js";
import { ValidationError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";

type RequestWithFile = Request & { file?: { buffer: Buffer } };

export class VoiceController {
  public transcribe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = transcribeQuerySchema.parse(req.query);

      let audioBuffer: Buffer | null = null;
      const customReq = req as RequestWithFile;

      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        audioBuffer = req.body;
      } else if (customReq.file && customReq.file.buffer) {
        audioBuffer = customReq.file.buffer;
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new ValidationError("No audio payload provided in request body");
      }

      const result = await voiceService.transcribeAudio(audioBuffer, {
        model: query.model,
        language: query.language,
      });

      successResponse(res, result, "Audio transcribed successfully");
    } catch (error) {
      next(error);
    }
  };

  public speak = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const input = speakRequestSchema.parse(req.body);

      const { audioBuffer, speechGenerationTimeMs } = await voiceService.generateSpeech(
        input.text,
        {
          voice: input.voice,
          rate: input.rate,
          pitch: input.pitch,
        },
      );

      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Content-Length", audioBuffer.length);
      res.setHeader("X-Speech-Generation-Time-Ms", speechGenerationTimeMs.toString());
      res.status(200).send(audioBuffer);
    } catch (error) {
      next(error);
    }
  };
}

export const voiceController = new VoiceController();
