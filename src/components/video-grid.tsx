import React, { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@minutely/shared/ui';
import { Badge } from '@minutely/shared/ui';
import { useVideoStream } from '@/hooks/use-media-stream';
import { cn } from "@minutely/shared";
import { MicOff } from 'lucide-react';

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
    const videoRef = useRef<HTMLVideoElement>(null!);
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
        className="relative h-full w-full overflow-hidden rounded-2xl bg-[#111] border border-white/5 transition-all duration-500 group shadow-2xl"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          className={cn(
            "h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.02]",
            isLocal && "scale-x-[-1]",
            (!stream || isVideoOff) && "hidden"
          )}
        />
        
        {(!stream || isVideoOff) && (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <Avatar className="h-24 w-24 border-2 border-white/10 relative z-10 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                <AvatarFallback className="text-3xl font-bold bg-[#151515] text-white/90">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="mt-6 text-sm font-semibold text-white/80 tracking-wide uppercase">{displayName}</p>
            {isVideoOff && (
              <Badge variant="outline" className="mt-3 bg-black/40 border-white/5 text-[10px] uppercase tracking-widest text-white/30 font-bold px-3">Camera Off</Badge>
            )}
          </div>
        )}

        {/* Name and status badges Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className={cn(
                 "h-2 w-2 rounded-full",
                 stream ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-white/20"
               )} />
               <p className="text-xs font-bold text-white/90 tracking-tight drop-shadow-md">{displayName}</p>
            </div>
            <div className="flex gap-1.5">
              {isLocal && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold h-5 px-2">
                  YOU
                </Badge>
              )}
              {isMuted && (
                <div className="bg-red-500/20 text-red-500 p-1 rounded-md backdrop-blur-sm border border-red-500/20">
                  <MicOff className="h-3 w-3" />
                </div>
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
    <div className={cn(
      "grid gap-4 w-full h-full animate-in fade-in zoom-in-95 duration-500",
      getGridClass()
    )}>
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
