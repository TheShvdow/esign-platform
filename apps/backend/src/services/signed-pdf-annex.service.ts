import { Injectable, Logger } from '@nestjs/common';
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { Document } from '../entities/document.entity';

const PAGE_WIDTH = 595.28;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const BOTTOM_SAFE = 72;

@Injectable()
export class SignedPdfAnnexService {
  private readonly logger = new Logger(SignedPdfAnnexService.name);

  /** Ajoute une annexe en fin de PDF listant signataires et données d’authenticité (PDF uniquement). */
  async embedAnnexForSignedPdf(buffer: Buffer, document: Document): Promise<Buffer> {
    if (document.mimeType !== 'application/pdf') {
      return buffer;
    }
    const signatures = document.signatures?.filter(Boolean) ?? [];
    if (signatures.length === 0) {
      return buffer;
    }

    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const sorted = [...signatures].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      let page = pdfDoc.addPage([PAGE_WIDTH, 841.89]);
      let y = 800;

      const ensureSpace = (needed: number) => {
        if (y - needed < BOTTOM_SAFE) {
          page = pdfDoc.addPage([PAGE_WIDTH, 841.89]);
          y = 800;
        }
      };

      const title = 'Certificat de signature électronique';
      ensureSpace(40);
      page.drawText(title, {
        x: MARGIN,
        y,
        size: 16,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.22),
      });
      y -= 28;

      const introLines = [
        'Ce document PDF inclut une annexe décrivant les signatures électroniques appliquées au fichier original.',
        'Empreinte cryptographique du fichier au dépôt (intégrité de référence) :',
      ];
      for (const line of introLines) {
        y = this.drawParagraph(page, font, line, MARGIN, y, 10);
        y -= 8;
        ensureSpace(24);
      }

      for (const chunk of this.chunkText(document.fileHash, 64)) {
        ensureSpace(14);
        page.drawText(chunk, {
          x: MARGIN,
          y,
          size: 9,
          font,
          color: rgb(0.2, 0.25, 0.35),
        });
        y -= 12;
      }
      y -= 16;

      ensureSpace(40);
      page.drawText('Document', {
        x: MARGIN,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.22),
      });
      y -= 18;
      y = this.drawLabelValue(page, font, fontBold, 'Titre', document.title, y, ensureSpace);
      y = this.drawLabelValue(
        page,
        font,
        fontBold,
        'Identifiant',
        document.id,
        y,
        ensureSpace,
      );
      if (document.owner) {
        y = this.drawLabelValue(
          page,
          font,
          fontBold,
          'Déposé par',
          `${document.owner.firstName} ${document.owner.lastName} (${document.owner.email})`,
          y,
          ensureSpace,
        );
      }
      y -= 12;

      sorted.forEach((sig, index) => {
        ensureSpace(160);
        page.drawText(`Signature ${index + 1} / ${sorted.length}`, {
          x: MARGIN,
          y,
          size: 12,
          font: fontBold,
          color: rgb(0.12, 0.16, 0.22),
        });
        y -= 18;

        const signer = sig.signer;
        const signerLabel = signer
          ? `${signer.firstName} ${signer.lastName}`
          : '—';
        const email = signer?.email ?? '—';

        y = this.drawLabelValue(
          page,
          font,
          fontBold,
          'Signataire',
          signerLabel,
          y,
          ensureSpace,
        );
        y = this.drawLabelValue(page, font, fontBold, 'E-mail', email, y, ensureSpace);
        y = this.drawLabelValue(
          page,
          font,
          fontBold,
          'Date / heure (UTC)',
          new Date(sig.createdAt).toISOString(),
          y,
          ensureSpace,
        );
        y = this.drawLabelValue(
          page,
          font,
          fontBold,
          'Type de signature',
          sig.type,
          y,
          ensureSpace,
        );
        y = this.drawLabelValue(
          page,
          font,
          fontBold,
          'Identifiant certificat',
          sig.certificateId,
          y,
          ensureSpace,
        );
        y = this.drawLabelValue(
          page,
          font,
          fontBold,
          'Vérification cryptographique',
          sig.isValid ? 'Coché comme valide au moment de la signature' : 'Non validée ou invalide',
          y,
          ensureSpace,
        );
        if (sig.validationErrors) {
          y = this.drawParagraph(
            page,
            font,
            `Détail : ${sig.validationErrors}`,
            MARGIN,
            y,
            9,
          );
          y -= 8;
        }
        y -= 14;
      });

      ensureSpace(36);
      page.drawText(
        'Les métadonnées ci-dessus sont issues du registre de signatures de la plateforme.',
        {
          x: MARGIN,
          y,
          size: 8,
          font,
          color: rgb(0.35, 0.38, 0.42),
        },
      );

      const bytes = await pdfDoc.save();
      return Buffer.from(bytes);
    } catch (err) {
      this.logger.warn(
        `Annexe PDF non insérée (document ${document.id}) : ${err instanceof Error ? err.message : err}`,
      );
      return buffer;
    }
  }

  private drawLabelValue(
    page: PDFPage,
    font: PDFFont,
    bold: PDFFont,
    label: string,
    value: string,
    y: number,
    ensureSpace: (n: number) => void,
  ): number {
    ensureSpace(22);
    page.drawText(`${label} :`, {
      x: MARGIN,
      y,
      size: 10,
      font: bold,
      color: rgb(0.2, 0.22, 0.28),
    });
    y -= 14;
    return this.drawParagraph(page, font, value, MARGIN + 8, y, 10);
  }

  private drawParagraph(
    page: PDFPage,
    font: PDFFont,
    text: string,
    x: number,
    startY: number,
    size: number,
  ): number {
    let y = startY;
    const lines = this.wrapText(font, text, size, CONTENT_WIDTH - (x - MARGIN));
    for (const line of lines) {
      page.drawText(line, {
        x,
        y,
        size,
        font,
        color: rgb(0.15, 0.18, 0.22),
      });
      y -= size + 3;
    }
    return y;
  }

  private wrapText(
    font: PDFFont,
    text: string,
    size: number,
    maxWidth: number,
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        current = trial;
      } else {
        if (current) {
          lines.push(current);
        }
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          lines.push(...this.hardBreak(font, word, size, maxWidth));
          current = '';
        } else {
          current = word;
        }
      }
    }
    if (current) {
      lines.push(current);
    }
    return lines.length ? lines : [''];
  }

  private hardBreak(
    font: PDFFont,
    word: string,
    size: number,
    maxWidth: number,
  ): string[] {
    const out: string[] = [];
    let chunk = '';
    for (const ch of word) {
      const next = chunk + ch;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        chunk = next;
      } else {
        if (chunk) {
          out.push(chunk);
        }
        chunk = ch;
      }
    }
    if (chunk) {
      out.push(chunk);
    }
    return out.length ? out : [word];
  }

  private chunkText(hex: string, len: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < hex.length; i += len) {
      chunks.push(hex.slice(i, i + len));
    }
    return chunks.length ? chunks : [hex];
  }
}
