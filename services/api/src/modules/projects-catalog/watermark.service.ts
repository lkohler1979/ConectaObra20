import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { env } from "../../config/env";
import { assertSafeExternalUrl } from "../../common/security/url-safety";

export interface WatermarkResult {
  url: string;
  aplicada: boolean;
}

/**
 * Marca d'água real na entrega do catálogo de plantas (E9-05 parte 2) —
 * baixa o arquivo original (URL pública do S3, mesma convenção de
 * `Product.fotos`/`PortfolioItem.fotos`), aplica a marca (imagem via
 * `sharp`, PDF via `pdf-lib`) e reenvia sob uma key nova. Sem S3
 * configurado (mesma checagem do `MediaService`, P-018) ou tipo de
 * arquivo não suportado (ex.: .dwg/.skp/.zip), devolve a URL original
 * sem marca d'água — não bloqueia a compra, só documenta a limitação
 * (`aplicada: false`, ver PENDENCIAS.md).
 */
@Injectable()
export class WatermarkService {
  private readonly logger = new Logger(WatermarkService.name);
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

  async watermarkFile(fileUrl: string, marcaTexto: string): Promise<WatermarkResult> {
    if (!this.s3 || !env.S3_BUCKET) {
      return { url: fileUrl, aplicada: false };
    }

    try {
      // Mitigação de SSRF (E10-05): `fileUrl` vem de `ProjectCatalog.arquivos`,
      // preenchido pelo PRESTADOR/TECNICO dono do projeto — sem essa checagem,
      // um valor malicioso (ex.: endpoint de metadata de nuvem, serviço
      // interno) faria o servidor buscar por ele.
      await assertSafeExternalUrl(fileUrl);

      const res = await fetch(fileUrl);
      if (!res.ok) {
        throw new Error(`download falhou com status ${res.status}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? "";

      let watermarked: Buffer;
      let ext: string;
      if (contentType.includes("pdf") || /\.pdf$/i.test(fileUrl)) {
        watermarked = await this.watermarkPdf(buffer, marcaTexto);
        ext = ".pdf";
      } else if (contentType.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(fileUrl)) {
        watermarked = await this.watermarkImage(buffer, marcaTexto);
        ext = this.imageExtension(contentType, fileUrl);
      } else {
        // Tipo não suportado (ex.: .dwg/.skp/.zip) — entrega o original mesmo.
        return { url: fileUrl, aplicada: false };
      }

      const key = `catalog-watermarked/${randomUUID()}${ext}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
          Body: watermarked,
          ContentType: contentType || undefined,
        }),
      );

      return { url: this.publicUrlFor(key), aplicada: true };
    } catch (error) {
      this.logger.warn(
        `Falha ao aplicar marca d'água em ${fileUrl}: ${(error as Error).message} — entregando arquivo original`,
      );
      return { url: fileUrl, aplicada: false };
    }
  }

  private async watermarkImage(buffer: Buffer, texto: string): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const width = metadata.width ?? 800;
    const height = metadata.height ?? 600;
    const fontSize = Math.max(18, Math.round(width / 18));

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
              transform="rotate(-30 ${width / 2} ${height / 2})"
              fill="rgba(255,255,255,0.55)" font-size="${fontSize}"
              font-family="sans-serif" font-weight="bold">${this.escapeXml(texto)}</text>
      </svg>`;

    return image.composite([{ input: Buffer.from(svg), gravity: "center" }]).toBuffer();
  }

  private async watermarkPdf(buffer: Buffer, texto: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(buffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const size = 36;

    for (const page of pdfDoc.getPages()) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(texto, size);
      page.drawText(texto, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size,
        font,
        color: rgb(0.55, 0.55, 0.55),
        opacity: 0.35,
        rotate: degrees(-30),
      });
    }

    return Buffer.from(await pdfDoc.save());
  }

  private imageExtension(contentType: string, url: string): string {
    if (contentType.includes("png")) return ".png";
    if (contentType.includes("webp")) return ".webp";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
    const match = /\.(jpe?g|png|webp)$/i.exec(url);
    return match ? `.${match[1].toLowerCase()}` : ".jpg";
  }

  private escapeXml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  private publicUrlFor(key: string): string {
    if (env.S3_ENDPOINT) {
      return `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}/${key}`;
    }
    return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
  }
}
