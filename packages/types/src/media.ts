import { z } from "zod";

/** Compressão/otimização acontece depois do upload (worker assíncrono) — o client sobe o original. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export const presignedUploadInputSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});
export type PresignedUploadInput = z.infer<typeof presignedUploadInputSchema>;

export const presignedUploadOutputSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  publicUrl: z.string().url(),
  expiresInSeconds: z.number().int().positive(),
});
export type PresignedUploadOutput = z.infer<typeof presignedUploadOutputSchema>;
