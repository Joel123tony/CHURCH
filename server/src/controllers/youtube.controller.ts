import type { Request, Response } from "express";
import { detectLiveBroadcast } from "../services/youtube";

export async function getLiveStatus(_req: Request, res: Response) {
  const live = await detectLiveBroadcast();
  res.json(live);
}

