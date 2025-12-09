type ProcessedImage = {
  buffer: Buffer;
  contentType: string;
};

let sharpInstance: typeof import('sharp') | null | undefined;

async function getSharp() {
  if (sharpInstance !== undefined) {
    return sharpInstance;
  }

  try {
    const sharp = await import('sharp');
    sharpInstance = sharp.default ?? sharp;
  } catch (error) {
    console.warn('[media] sharp no esta instalado, se usara el archivo original', error);
    sharpInstance = null;
  }

  return sharpInstance;
}

export async function toWebp(buffer: Buffer, width?: number): Promise<ProcessedImage> {
  const sharp = await getSharp();

  if (!sharp) {
    return { buffer, contentType: 'application/octet-stream' };
  }

  const pipeline = sharp(buffer).rotate();

  if (width) {
    pipeline.resize({ width, withoutEnlargement: true });
  }

  const output = await pipeline.webp({ quality: 82 }).toBuffer();

  return { buffer: output, contentType: 'image/webp' };
}

export async function createThumbnail(buffer: Buffer) {
  return toWebp(buffer, 480);
}
