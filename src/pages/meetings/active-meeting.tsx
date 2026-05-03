import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '@/contexts/meeting-context';
import { useMediaStream, useParticipantStreams } from '@/hooks/use-media-stream';
import { useWebRTC } from '@/hooks/use-webrtc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Avatar, AvatarFallback, AvatarGroup, Badge, Separator, Label } from '@minutely/shared/ui';
import { formatMeetingCode } from '@/lib/meeting-utils';
import { getMeetingPeerEmail } from '@/lib/participant-identity';
import { apiBaseUrl, minutelyApi } from '@/lib/api-client';
import { VideoGrid } from '@/components/video-grid';
import { cn } from '@minutely/shared';
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
  Users,
  Info,
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
  const [showParticipants, setShowParticipants] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
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
    <div className="fixed inset-0 flex flex-col bg-[#040404] text-white selection:bg-primary/30 overflow-hidden">
      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 backdrop-blur-md">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight leading-none">{activeMeeting.title || 'Instant Meeting'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Live</span>
              </div>
              <Separator orientation="vertical" className="h-2.5 bg-white/20" />
              <span className="text-[10px] text-white/50 font-medium">
                {mergedParticipants.length + 1} participants
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md h-10 w-10"
            onClick={() => setShowInfo(!showInfo)}
          >
            <Info className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md h-10 w-10"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Video Grid Section */}
        <div className="flex-1 relative flex items-center justify-center p-4 pt-20 pb-28">
          {mediaStream.isLoading ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
              <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-white/60 font-medium tracking-wide">Initializing secure connection...</p>
            </div>
          ) : (
            <div className="w-full h-full max-w-7xl mx-auto">
              <VideoGrid
                localStream={mediaStream.stream}
                localDisplayName="You"
                localAudioEnabled={micEnabled}
                localVideoEnabled={videoEnabled}
                remoteStreams={remoteParticipants}
              />
            </div>
          )}
        </div>

        {/* Floating Side Panels */}
        {showParticipants && (
          <div className="absolute top-20 bottom-24 right-4 z-40 w-80 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold">Participants</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowParticipants(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <Avatar className="h-9 w-9 border border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">Y</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate">You</p>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-tight">Host</p>
                </div>
                <div className="flex gap-1.5">
                  {micEnabled ? <Mic className="h-3.5 w-3.5 text-white/40" /> : <MicOff className="h-3.5 w-3.5 text-red-500" />}
                </div>
              </div>

              {mergedParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <Avatar className="h-9 w-9 border border-white/10 group-hover:border-white/20 transition-colors">
                    <AvatarFallback className="bg-white/5 text-xs font-bold">
                      {participant.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{participant.displayName}</p>
                    <p className="text-[10px] text-white/30 truncate">{participant.email}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none text-[9px] h-4">Online</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {showInfo && (
          <div className="absolute top-20 bottom-24 right-4 z-40 w-80 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold">Meeting Info</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowInfo(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2 text-center">
                <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Share meeting ID</Label>
                <div 
                  className="p-4 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={handleCopyCode}
                >
                  <p className="text-2xl font-mono font-bold tracking-tighter text-primary group-hover:scale-105 transition-transform">{formattedCode}</p>
                </div>
              </div>
              
              <Button className="w-full h-12 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95" onClick={handleCopyCode}>
                {copied ? <><Check className="mr-2 h-4 w-4" /> Copied!</> : <><Copy className="mr-2 h-4 w-4" /> Copy Invitation</>}
              </Button>

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-xs border-t border-white/10 pt-4">
                  <span className="text-white/40">Status</span>
                  <Badge variant="outline" className="text-primary border-primary/30">Active</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Encryption</span>
                  <span className="text-green-500 font-medium">End-to-end</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500">
        <Button
          variant={micEnabled ? 'ghost' : 'destructive'}
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full transition-all duration-300",
            micEnabled ? "bg-white/5 hover:bg-white/10 text-white" : "hover:bg-red-600 shadow-lg shadow-red-500/20"
          )}
          onClick={handleToggleMic}
        >
          {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={videoEnabled ? 'ghost' : 'destructive'}
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full transition-all duration-300",
            videoEnabled ? "bg-white/5 hover:bg-white/10 text-white" : "hover:bg-red-600 shadow-lg shadow-red-500/20"
          )}
          onClick={handleToggleVideo}
        >
          {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Separator orientation="vertical" className="h-8 bg-white/10 mx-1" />

        <Button
          variant="destructive"
          className="h-12 px-6 rounded-full font-bold tracking-tight hover:bg-red-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20"
          onClick={() => {
            setEndType('leave');
            setShowEndDialog(true);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Leave
        </Button>
      </div>

      {/* Media Stream Error Overlay */}
      {mediaStream.error && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/50 bg-black/80 backdrop-blur-xl p-4 shadow-2xl text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-semibold">
              {mediaStream.error}
            </p>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10 ml-2" onClick={() => mediaStream.stopStream()}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* End Meeting Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="bg-[#0c0c0c] border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {endType === 'leave' ? 'Leave Meeting' : 'End Meeting for All'}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {endType === 'leave'
                ? 'You will leave the meeting, but other participants can continue their session.'
                : 'This will disconnect all participants immediately. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {endType === 'endForAll' && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-semibold">
                This ends the session for {mergedParticipants.length + 1} people.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="ghost"
              className="rounded-xl hover:bg-white/5 font-semibold"
              onClick={() => setShowEndDialog(false)}
            >
              Stay
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold px-6 shadow-lg shadow-red-500/20"
              onClick={handleEndMeeting}
            >
              {endType === 'leave' ? 'Leave Now' : 'End for All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
