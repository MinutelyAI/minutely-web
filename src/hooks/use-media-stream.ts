import { useEffect, useRef, useState } from 'react';

interface MediaStreamState {
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  stream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

interface UseMediaStreamOptions {
  audio?: boolean;
  video?: boolean;
}

/**
 * Hook to manage local media stream (camera and microphone)
 */
export function useMediaStream(options: UseMediaStreamOptions = { audio: true, video: true }) {
  const [mediaState, setMediaState] = useState<MediaStreamState>({
    audioTrack: null,
    videoTrack: null,
    stream: null,
    isAudioEnabled: options.audio ?? true,
    isVideoEnabled: options.video ?? true,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize media stream
  useEffect(() => {
    let isMounted = true;

    const initializeMediaStream = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let stream: MediaStream;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: options.audio !== false,
            video: options.video !== false ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          });
        } catch (primaryError) {
          // In multi-window local testing, camera initialization can fail with different browser/device errors.
          // Keep the call alive by retrying with audio-only whenever video was requested.
          if (options.video !== false) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: options.audio !== false,
                video: false,
              });
              setError('Camera is unavailable. Joined with microphone only.');
            } catch {
              throw primaryError;
            }
          } else {
            throw primaryError;
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const audioTrack = stream.getAudioTracks()[0] || null;
        const videoTrack = stream.getVideoTracks()[0] || null;
        streamRef.current = stream;

        setMediaState({
          audioTrack,
          videoTrack,
          stream,
          isAudioEnabled: audioTrack ? audioTrack.enabled : false,
          isVideoEnabled: videoTrack ? videoTrack.enabled : false,
        });

        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          const mediaError = err as DOMException;
          const errorMessage = mediaError?.name === 'NotReadableError'
            ? 'Camera or microphone is already in use by another app/window.'
            : err instanceof Error
              ? err.message
              : 'Failed to access media devices';
          setError(errorMessage);
          setIsLoading(false);
          console.error('Media stream error:', err);
        }
      }
    };

    initializeMediaStream();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const toggleAudio = (enabled?: boolean) => {
    if (mediaState.audioTrack) {
      const newState = enabled ?? !mediaState.isAudioEnabled;
      mediaState.audioTrack.enabled = newState;
      setMediaState((prev) => ({ ...prev, isAudioEnabled: newState }));
    }
  };

  const toggleVideo = async (enabled?: boolean) => {
    const requestedState = enabled ?? !mediaState.isVideoEnabled;

    if (mediaState.videoTrack) {
      mediaState.videoTrack.enabled = requestedState;
      setMediaState((prev) => ({ ...prev, isVideoEnabled: requestedState }));
      return;
    }

    if (!requestedState) {
      setMediaState((prev) => ({ ...prev, isVideoEnabled: false }));
      return;
    }

    try {
      const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const newVideoTrack = videoOnlyStream.getVideoTracks()[0] || null;

      if (!newVideoTrack) {
        setError('Unable to access camera.');
        return;
      }

      setError(null);
      setMediaState((prev) => {
        if (prev.stream) {
          prev.stream.addTrack(newVideoTrack);
          streamRef.current = prev.stream;
          return {
            ...prev,
            videoTrack: newVideoTrack,
            isVideoEnabled: true,
          };
        }

        const mergedStream = new MediaStream();
        if (prev.audioTrack) {
          mergedStream.addTrack(prev.audioTrack);
        }
        mergedStream.addTrack(newVideoTrack);
        streamRef.current = mergedStream;
        return {
          ...prev,
          stream: mergedStream,
          videoTrack: newVideoTrack,
          isVideoEnabled: true,
        };
      });
    } catch (error) {
      console.error('Video re-enable error:', error);
      setError('Unable to re-enable camera. Close other apps using the camera and try again.');
    }
  };

  const stopStream = () => {
    if (mediaState.stream) {
      mediaState.stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMediaState({
        audioTrack: null,
        videoTrack: null,
        stream: null,
        isAudioEnabled: false,
        isVideoEnabled: false,
      });
    }
  };

  return {
    ...mediaState,
    toggleAudio,
    toggleVideo,
    stopStream,
    error,
    isLoading,
  };
}

/**
 * Hook to attach media stream to video element
 */
export function useVideoStream(videoRef: React.RefObject<HTMLVideoElement>, stream: MediaStream | null) {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef, stream]);
}

/**
 * Hook to manage participant streams
 */
export function useParticipantStreams() {
  const [participantStreams, setParticipantStreams] = useState<Map<string, MediaStream>>(new Map());

  const addParticipantStream = (participantId: string, stream: MediaStream) => {
    setParticipantStreams((prev) => new Map(prev).set(participantId, stream));
  };

  const removeParticipantStream = (participantId: string) => {
    setParticipantStreams((prev) => {
      const newMap = new Map(prev);
      const stream = newMap.get(participantId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      newMap.delete(participantId);
      return newMap;
    });
  };

  const getParticipantStream = (participantId: string) => {
    return participantStreams.get(participantId) || null;
  };

  return {
    participantStreams,
    addParticipantStream,
    removeParticipantStream,
    getParticipantStream,
  };
}
