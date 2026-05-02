import React, { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@minutely/shared/ui';
import { Badge } from '@minutely/shared/ui';
import { useVideoStream } from '@/hooks/use-media-stream';

interface VideoItemProps {
  stream: MediaStream | null;
  displayName: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

/**
 * Component to display a single participant's video stream
 */
const VideoItem = React.forwardRef<HTMLDivElement, VideoItemProps>(
  ({ stream, displayName, isLocal = false, isMuted = false, isVideoOff = false }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useVideoStream(videoRef, stream);

    const getInitials = () => {
      return displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);
    };

    return (
      <div
        ref={ref}
        className="relative h-full w-full overflow-hidden rounded-lg bg-muted"
      >
        {stream && !isVideoOff ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal || isMuted}
            className={`h-full w-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarFallback className="text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <p className="mt-4 text-sm font-medium text-foreground">{displayName}</p>
            {isVideoOff && (
              <p className="mt-1 text-xs text-muted-foreground">Camera off</p>
            )}
          </div>
        )}

        {/* Name and status badges */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <div className="flex gap-1">
              {isLocal && (
                <Badge variant="secondary" className="text-xs">
                  You
                </Badge>
              )}
              {isMuted && (
                <Badge variant="secondary" className="text-xs">
                  Muted
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoItem.displayName = 'VideoItem';

export default VideoItem;

interface VideoGridProps {
  localStream: MediaStream | null;
  localDisplayName: string;
  localAudioEnabled: boolean;
  localVideoEnabled: boolean;
  remoteStreams: Array<{
    id: string;
    displayName: string;
    stream: MediaStream | null;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }>;
}

/**
 * Component to display a grid of participant videos
 */
export function VideoGrid({
  localStream,
  localDisplayName,
  localAudioEnabled,
  localVideoEnabled,
  remoteStreams,
}: VideoGridProps) {
  const totalParticipants = remoteStreams.length + 1; // Including self
  const allStreams = [
    {
      id: 'local',
      displayName: localDisplayName,
      stream: localStream,
      audioEnabled: localAudioEnabled,
      videoEnabled: localVideoEnabled,
      isLocal: true,
    },
    ...remoteStreams.map((s) => ({
      ...s,
      isLocal: false,
    })),
  ];

  // Calculate grid layout
  const getGridClass = () => {
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (totalParticipants <= 9) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  const getHeightClass = () => {
    if (totalParticipants === 1) return 'h-[600px]';
    return 'h-[500px]';
  };

  return (
    <div className={`grid ${getGridClass()} gap-2 ${getHeightClass()} w-full`}>
      {allStreams.map((participant) => (
        <VideoItem
          key={participant.id}
          stream={participant.stream}
          displayName={participant.displayName}
          isLocal={participant.isLocal}
          isMuted={!participant.audioEnabled && participant.isLocal}
          isVideoOff={!participant.videoEnabled}
        />
      ))}
    </div>
  );
}
