import Tesseract from 'tesseract.js';
import { PDFParse } from 'pdf-parse';

export async function extractText(contents: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: contents });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  const result = await Tesseract.recognize(contents, 'eng');
  return result.data.text.trim();
}
