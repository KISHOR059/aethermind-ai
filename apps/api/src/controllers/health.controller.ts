import type { Request, Response } from "express";

export async function getHealth(
  _request: Request,
  response: Response,
): Promise<void> {
  response.json({
    status: "ok",
    service: "aethermind-api",
    version: "1.0.0",
  });
}
