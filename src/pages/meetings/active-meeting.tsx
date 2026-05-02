import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '@/contexts/meeting-context';
import { useMediaStream, useParticipantStreams } from '@/hooks/use-media-stream';
import { useWebRTC } from '@/hooks/use-webrtc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@minutely/shared/ui';
import { Button } from '@minutely/shared/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@minutely/shared/ui';
import { Avatar, AvatarFallback, AvatarGroup } from '@minutely/shared/ui';
import { Badge } from '@minutely/shared/ui';
import { Separator } from '@minutely/shared/ui';
import { Label } from '@minutely/shared/ui';
import { formatMeetingCode } from '@/lib/meeting-utils';
import { getMeetingPeerEmail } from '@/lib/participant-identity';
import { apiBaseUrl, minutelyApi } from '@/lib/api-client';
import { VideoGrid } from '@/components/video-grid';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  X,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

const toDisplayName = (email: string) =>
  email
    .split('@')[0]
    .split('+')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function ActiveMeetingPage() {
  const { activeMeeting, endMeeting } = useMeeting();
  const navigate = useNavigate();
  
  // Media stream management
  const mediaStream = useMediaStream({
    audio: activeMeeting?.settings.microphone ?? true,
    video: activeMeeting?.settings.video ?? true,
  });
  
  const { participantStreams } = useParticipantStreams();
  const [syncedParticipants, setSyncedParticipants] = useState<Array<{ email: string }>>([]);
  const token = localStorage.getItem('token');
  const localEmail = getMeetingPeerEmail(localStorage.getItem('user_email'));

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  }, [navigate]);
  
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endType, setEndType] = useState<'leave' | 'endForAll'>('leave');
  const [copied, setCopied] = useState(false);
  
  // Track local mic/video state
  const [micEnabled, setMicEnabled] = useState(mediaStream.isAudioEnabled);
  const [videoEnabled, setVideoEnabled] = useState(mediaStream.isVideoEnabled);
  
  // Simulate adding participant streams (in a real app, this would come from backend)
  const mergedParticipants = (() => {
    if (!activeMeeting) return [];

    const currentEmail = getMeetingPeerEmail(localStorage.getItem('user_email'));
    const map = new Map<string, { id: number; displayName: string; email: string; username: string }>();

    activeMeeting.participants.forEach((participant) => {
      map.set(participant.email.toLowerCase(), participant);
    });

    syncedParticipants.forEach((participant, index) => {
      const email = participant.email.toLowerCase();
      if (!email || email === currentEmail || map.has(email)) {
        return;
      }

      map.set(email, {
        id: Date.now() + index,
        displayName: toDisplayName(email),
        email,
        username: email.split('@')[0],
      });
    });

    return Array.from(map.values());
  })();

  const { remoteStreams } = useWebRTC({
    meetingId: activeMeeting?.id || '',
    localEmail,
    localStream: mediaStream.stream,
    participants: mergedParticipants.map((participant) => ({
      email: participant.email,
      displayName: participant.displayName,
    })),
    token,
    apiUrl: apiBaseUrl,
    onUnauthorized: handleUnauthorized,
  });

  const remoteParticipants = mergedParticipants.map((p) => ({
    id: `participant-${p.email}`,
    displayName: p.displayName,
    stream: remoteStreams.get(p.email.toLowerCase()) ?? participantStreams.get(p.email.toLowerCase()) ?? null,
    audioEnabled: true,
    videoEnabled: true,
  }));

  useEffect(() => {
    if (!activeMeeting) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const fetchParticipants = async () => {
      try {
        const response = await minutelyApi.getMeetingParticipants(activeMeeting.id);

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized();
          }
          return;
        }

        const data = await response.json();
        const participants = Array.isArray(data.participants)
          ? data.participants
              .filter((participant: { email?: string }) => participant?.email)
              .map((participant: { email: string }) => ({ email: String(participant.email) }))
          : [];

        setSyncedParticipants(participants);
      } catch {
        // Best-effort sync. UI keeps local participant list if fetch fails.
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 3000);
    return () => clearInterval(interval);
  }, [activeMeeting?.id]);

  useEffect(() => {
    if (!activeMeeting) {
      return;
    }

    const token = localStorage.getItem('token');
    const email = getMeetingPeerEmail(localStorage.getItem('user_email'));
    if (!token || !email) {
      return;
    }

    const syncState = async () => {
      try {
        const response = await minutelyApi.updateParticipantState({
          meeting_id: activeMeeting.id,
          email,
          has_joined: true,
          audio_enabled: micEnabled,
          video_enabled: videoEnabled,
        });

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized();
            return;
          }

          const message = await response.text();
          console.error('Participant state sync failed:', response.status, message);
        }
      } catch {
        // Best-effort state sync.
      }
    };

    syncState();
  }, [activeMeeting?.id, micEnabled, videoEnabled]);
  
  useEffect(() => {
    setMicEnabled(mediaStream.isAudioEnabled);
  }, [mediaStream.isAudioEnabled]);
  
  useEffect(() => {
    setVideoEnabled(mediaStream.isVideoEnabled);
  }, [mediaStream.isVideoEnabled]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaStream.stopStream();
    };
  }, []);

  if (!activeMeeting) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Active Meeting</CardTitle>
            <CardDescription>
              There is no active meeting. Start one to begin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/meetings/start-meetings')}>
              Start a Meeting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedCode = formatMeetingCode(activeMeeting.code);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleMic = () => {
    mediaStream.toggleAudio();
  };

  const handleToggleVideo = () => {
    mediaStream.toggleVideo();
  };

  const handleEndMeeting = () => {
    mediaStream.stopStream();
    endMeeting(endType === 'endForAll');
    setShowEndDialog(false);
    navigate('/meetings');
  };

  return (
    <section className="flex h-full flex-col gap-4 p-3 sm:p-5">
      {/* Meeting Header */}
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{activeMeeting.title || 'Instant Meeting'}</h1>
          <p className="text-sm text-muted-foreground">
            Code: <span className="font-mono font-semibold">{formattedCode}</span>
          </p>
        </div>
        <Badge variant="default" className="h-fit">
          LIVE
        </Badge>
      </div>

      {/* Media Stream Error Display */}
      {mediaStream.error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">
            {mediaStream.error}
          </p>
        </div>
      )}

      {/* Main Video Grid */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="h-full p-2 sm:p-4">
          {mediaStream.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Requesting camera and microphone access...</p>
            </div>
          ) : (
            <VideoGrid
              localStream={mediaStream.stream}
              localDisplayName="You"
              localAudioEnabled={micEnabled}
              localVideoEnabled={videoEnabled}
              remoteStreams={remoteParticipants}
            />
          )}
        </CardContent>
      </Card>

      {/* Meeting Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button
                variant={micEnabled ? 'default' : 'secondary'}
                size="lg"
                className="h-14 w-14 rounded-full p-0"
                onClick={handleToggleMic}
                title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micEnabled ? (
                  <Mic className="h-6 w-6" />
                ) : (
                  <MicOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                variant={videoEnabled ? 'default' : 'secondary'}
                size="lg"
                className="h-14 w-14 rounded-full p-0"
                onClick={handleToggleVideo}
                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoEnabled ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-14 w-14 rounded-full p-0"
                onClick={handleCopyCode}
                title="Copy meeting ID"
              >
                {copied ? (
                  <Check className="h-6 w-6 text-green-600" />
                ) : (
                  <Copy className="h-6 w-6" />
                )}
              </Button>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setEndType('leave');
                  setShowEndDialog(true);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Meeting
              </Button>

              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => {
                  setEndType('endForAll');
                  setShowEndDialog(true);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                End for All
              </Button>
            </div>
          </div>

          {/* Control Indicators */}
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            <Badge variant={micEnabled ? 'default' : 'secondary'}>
              {micEnabled ? '🎤 Microphone On' : '🎤 Microphone Off'}
            </Badge>
            <Badge variant={videoEnabled ? 'default' : 'secondary'}>
              {videoEnabled ? '📹 Camera On' : '📹 Camera Off'}
            </Badge>
            <Badge variant="secondary">
              👥 {mergedParticipants.length + 1} Participants
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Side Info Panel */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Meeting Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Share Meeting</CardTitle>
            <CardDescription>Invite others to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center">
              <p className="font-mono text-xl font-bold">{formattedCode}</p>
            </div>
            <Button className="w-full" onClick={handleCopyCode} variant={copied ? 'secondary' : 'default'}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Participants Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants ({mergedParticipants.length + 1})</CardTitle>
            <CardDescription>People in this meeting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">Y</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">You</p>
                  <p className="text-xs text-muted-foreground">Host</p>
                </div>
                <Badge variant="secondary" className="text-xs">Online</Badge>
              </div>

              {mergedParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 rounded-lg border p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {participant.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{participant.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{participant.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Online</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* End Meeting Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {endType === 'leave' ? 'Leave Meeting' : 'End Meeting for All'}
            </DialogTitle>
            <DialogDescription>
              {endType === 'leave'
                ? 'You will leave the meeting, but other participants can continue.'
                : 'All participants will be disconnected from this meeting. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {endType === 'endForAll' && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                This will end the meeting for all {mergedParticipants.length + 1} participants.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndMeeting}
            >
              {endType === 'leave' ? 'Leave Meeting' : 'End for All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
