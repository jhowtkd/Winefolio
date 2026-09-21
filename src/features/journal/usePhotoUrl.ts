import { useState, useEffect } from 'react';

export function usePhotoUrl(
  photoId: string | null | undefined,
  readPhoto: (id: string) => Promise<Blob | undefined>
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) {
      setUrl(null);
      return;
    }

    let active = true;
    let createdUrl: string | null = null;

    readPhoto(photoId)
      .then((blob) => {
        if (!active) return;
        if (blob) {
          createdUrl = URL.createObjectURL(blob);
          setUrl(createdUrl);
        } else {
          setUrl(null);
        }
      })
      .catch(() => {
        if (active) setUrl(null);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [photoId, readPhoto]);

  return url;
}
