import { randomUUID } from "node:crypto";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PresignedUploadInput, PresignedUploadOutput } from "@conectaobra/types/media";
import { env } from "../../config/env";

const UPLOAD_TTL_SECONDS = 300;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/**
 * Upload direto do client pro S3 via URL presigned — o servidor nunca recebe
 * os bytes do arquivo (E1-07). Compressão/otimização de fotos fica para um
 * worker assíncrono (BullMQ, já provisionado no docker-compose local) que
 * roda depois do upload — não dá pra comprimir de forma síncrona nesse
 * fluxo, já que os bytes não passam pelo Nest. Ver PENDENCIAS.md P-018.
 */
@Injectable()
export class MediaService {
  private readonly s3: S3Client | null;

  constructor() {
    this.s3 =
      env.S3_BUCKET && env.S3_REGION && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? new S3Client({
            region: env.S3_REGION,
            endpoint: env.S3_ENDPOINT,
            forcePathStyle: Boolean(env.S3_ENDPOINT),
            credentials: {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            },
          })
        : null;
  }

  async createPresignedUpload(
    userId: string,
    input: PresignedUploadInput,
  ): Promise<PresignedUploadOutput> {
    if (!this.s3 || !env.S3_BUCKET) {
      throw new ServiceUnavailableException(
        "Upload de mídia ainda não está configurado neste ambiente (S3) — ver PENDENCIAS.md P-018",
      );
    }

    const key = `uploads/${userId}/${randomUUID()}${EXTENSION_BY_MIME[input.contentType]}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: UPLOAD_TTL_SECONDS,
    });

    return {
      uploadUrl,
      key,
      publicUrl: this.publicUrlFor(key),
      expiresInSeconds: UPLOAD_TTL_SECONDS,
    };
  }

  private publicUrlFor(key: string): string {
    if (env.S3_ENDPOINT) {
      return `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}/${key}`;
    }
    return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
  }
}
