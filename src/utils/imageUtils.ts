/**
 * Image processing utilities for wine bottle label photos.
 * Downscales images to maintain optimal performance and stay safely
 * within localStorage quotas.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

/**
 * Resizes an image file or blob to max dimensions and converts to JPEG data URL
 */
export async function compressImageFile(
  file: File | Blob,
  options: ResizeOptions = {}
): Promise<string> {
  const { maxWidth = 900, maxHeight = 1200, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto 2D do canvas'));
          return;
        }

        // Fill background white in case of transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Falha ao processar arquivo de imagem'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Falha ao ler arquivo selecionado'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Captures the current frame of a video element to a compressed JPEG data URL
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  options: ResizeOptions = {}
): string {
  const { maxWidth = 900, maxHeight = 1200, quality = 0.85 } = options;

  let width = video.videoWidth || 640;
  let height = video.videoHeight || 480;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível capturar frame de vídeo');
  }

  // Draw current frame
  ctx.drawImage(video, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Converte data URL ou object URL em Blob seguro para IndexedDB
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
