/**
 * Client-side upload preparation shared across Asher web apps.
 *
 * Photos are resized (max 2560px edge) and encoded as WebP at high quality.
 * Falls back to JPEG when the browser cannot encode WebP. PDFs and office
 * docs pass through. Max 20 MB after preparation.
 */

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2560;
const VISUALLY_LOSSLESS_QUALITY = 0.92;

export class UploadFileTooLargeError extends Error {
  constructor(
    message = 'That file is larger than 20 MB even after compression. Choose a smaller file.'
  ) {
    super(message);
    this.name = 'UploadFileTooLargeError';
  }
}

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/bmp',
]);

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function isImageUpload(file: File): boolean {
  if (file.type && IMAGE_TYPES.has(file.type.toLowerCase())) return true;
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif', 'bmp'].includes(
    extensionOf(file.name)
  );
}

function renameWithExt(name: string, ext: string): string {
  return name.replace(/\.[^.]+$/, '') + `.${ext}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), type, quality);
  });
}

async function encodeCanvas(
  canvas: HTMLCanvasElement
): Promise<{ blob: Blob; type: string; ext: string } | null> {
  const quality = VISUALLY_LOSSLESS_QUALITY;
  const webp = await canvasToBlob(canvas, 'image/webp', quality);
  if (webp && webp.size > 0 && webp.type === 'image/webp') {
    return { blob: webp, type: 'image/webp', ext: 'webp' };
  }
  const jpeg = await canvasToBlob(canvas, 'image/jpeg', quality);
  if (jpeg && jpeg.size > 0) {
    return { blob: jpeg, type: 'image/jpeg', ext: 'jpg' };
  }
  return null;
}

async function compressImageFile(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const encoded = await encodeCanvas(canvas);
    if (!encoded || encoded.blob.size >= file.size) return file;

    return new File([encoded.blob], renameWithExt(file.name, encoded.ext), {
      type: encoded.type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export async function prepareUploadFile(file: File): Promise<File> {
  const prepared = isImageUpload(file) ? await compressImageFile(file) : file;
  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw new UploadFileTooLargeError();
  }
  return prepared;
}

export async function prepareUploadFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map(file => prepareUploadFile(file)));
}

export function formatMaxUploadLabel(): string {
  return '20 MB';
}
