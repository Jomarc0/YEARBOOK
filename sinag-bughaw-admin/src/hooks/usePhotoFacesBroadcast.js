import { useEffect, useRef } from 'react';

function normalizeStatus(status) {
  if (status === 'done' || status === 'analyzed' || status === 'matched') return 'done';
  if (status === 'no_matches') return 'done';
  if (status === 'failed') return 'error';
  return status ?? 'pending';
}

export function usePhotoFacesBroadcast(onEvent, { photoIds = null, enabled = true } = {}) {
  const handlerRef = useRef(onEvent);
  useEffect(() => { handlerRef.current = onEvent; }, [onEvent]);

  const photoIdsRef = useRef(photoIds);
  useEffect(() => { photoIdsRef.current = photoIds; }, [photoIds]);

  useEffect(() => {
    if (!enabled) return undefined;

    if (typeof window === 'undefined' || !window.Echo) {
      if (import.meta.env.DEV) {
        console.warn('[usePhotoFacesBroadcast] window.Echo is not available.');
      }
      return undefined;
    }

    const channel = window.Echo.channel('photos');

    const listener = (payload) => {
      const event = {
        photo_id: payload?.photo_id,
        status: normalizeStatus(payload?.status),
        face_count: payload?.face_count ?? 0,
        matches: payload?.matches ?? [],
      };
      const ids = photoIdsRef.current;

      if (ids?.length && !ids.includes(event.photo_id)) return;
      handlerRef.current(event);
    };

    channel.listen('.PhotoFacesAnalyzed', listener);

    return () => {
      channel.stopListening('.PhotoFacesAnalyzed', listener);
    };
  }, [enabled]);
}
