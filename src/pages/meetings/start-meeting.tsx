import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@minutely/shared/ui";
import { Button } from "@minutely/shared/ui";
import { Toggle } from "@minutely/shared/ui";
import { Input } from "@minutely/shared/ui";
import { Label } from "@minutely/shared/ui";
import { Textarea } from "@minutely/shared/ui";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from "@minutely/shared/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MicrophoneIcon as Microphone,
  MicrophoneSlashIcon as MicrophoneOff,
  VideoCameraIcon as Video,
  VideoCameraSlashIcon as VideoOff,
  SubtitlesIcon as AITranscription,
  SubtitlesSlashIcon as AITranscriptionOff,
  PencilSimpleSlashIcon as AINotesOff,
  ArrowRightIcon as ArrowRight,
  PencilSimpleIcon as AINotes,
} from "@phosphor-icons/react/dist/ssr";
import StartMeetingSheet from "@/components/start-meeting/start-meeting-sheet";
import { Separator } from "@minutely/shared/ui";
import {
  CalendarClock,
  Clock,
  MapPin,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { MeetingParticipant, ActiveMeeting } from "@/types";
import { UserIcon, CalendarIcon } from "@phosphor-icons/react";
import { useMeeting } from "@/contexts/meeting-context";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@minutely/shared/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@minutely/shared/ui";
import { TimePicker } from "@minutely/shared/ui";
import { cn } from "@minutely/shared/utils";
import { minutelyApi } from "@/lib/api-client";
import { useEffect } from "react";


export default function StartMeetingPage() {
  const navigate = useNavigate();
  const { createMeeting, scheduleMeeting } = useMeeting();

  const [meetingTitle, setMeetingTitle] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [video, setVideo] = useState(true);
  const [mic, setMic] = useState(true);
  const [transcript, setAITranscription] = useState(true);
  const [notes, setAINotes] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantError, setParticipantError] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<MeetingParticipant[]>([]);
  const [meetingCode, setMeetingCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const [openStartMeeting, setOpenStartMeeting] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);

  useEffect(() => {
    minutelyApi.getNextMeeting()
      .then((res) => res.json())
      .then((json) => {
        if (json && json.data) {
          setUpcomingMeetings([{
            id: json.data.id,
            title: json.data.title,
            time: new Date(json.data.scheduled_for).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            duration: "30 min",
            room: "Virtual",
            attendees: 1,
            status: json.data.status,
            joinable: true
          }]);
        }
      })
      .catch(console.error);
  }, []);

  const activeTools = [
    mic ? "Microphone on" : "Microphone off",
    video ? "Camera on" : "Camera off",
    transcript ? "AI transcription ready" : "AI transcription off",
    notes ? "AI notes ready" : "AI notes off",
  ];

  const addParticipantByEmail = () => {
    const normalizedEmail = participantEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setParticipantError("Enter an email address to add a participant.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setParticipantError("Enter a valid email address.");
      return;
    }

    if (selectedParticipants.some((participant) => participant.email === normalizedEmail)) {
      setParticipantError("That participant is already added.");
      return;
    }

    const userName = normalizedEmail.split('@')[0];
    const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

    setSelectedParticipants((current) => [
      ...current,
      {
        id: Date.now(),
        displayName: displayName,
        email: normalizedEmail,
        username: userName,
        avatar: "",
      }
    ]);
    setParticipantEmail("");
    setParticipantError("");
  };

  const removeParticipant = (participantId: number) => {
    setSelectedParticipants((current) =>
      current.filter((participant) => participant.id !== participantId)
    );
    setParticipantError("");
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        toast.error("Please choose a date and time for a scheduled meeting.");
        return;
      }

      const dateString = format(scheduledDate, "yyyy-MM-dd");
      const scheduledAt = new Date(`${dateString}T${scheduledTime}`);

      try {
        await scheduleMeeting({
          id: Date.now(),
          title: meetingTitle.trim(),
          category: "Internal",
          scheduledAt,
          meeting: {
            id: Date.now(),
            title: meetingTitle.trim(),
            dateLabel: scheduledAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              weekday: "short",
            }),
            timeRange: scheduledAt.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            duration: "30 min",
            location: "Virtual",
            organizer: "You",
            participants: selectedParticipants,
            summary: quickNote,
          },
        });
        toast.success("Meeting scheduled successfully!");
        setOpenStartMeeting(false);
        navigate("/meetings/calender");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to schedule meeting");
      }
      return;
    }

    try {
      const response = await minutelyApi.createInstantMeeting();

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to start meeting");
      }

      const meeting = data.meeting ?? {};
      const newMeeting: ActiveMeeting = {
        id: String(meeting.id || data.join_code),
        code: String(data.join_code || meeting.id),
        title: meetingTitle,
        hostId: 1,
        participants: selectedParticipants,
        settings: {
          microphone: mic,
          video: video,
          aiTranscription: transcript,
          aiNotes: notes,
        },
        quickNote: quickNote,
        startTime: new Date(),
        isScheduled: false,
        status: "active",
      };

      createMeeting(newMeeting);
      setOpenStartMeeting(false);
      navigate("/meetings/active-meeting");
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : "Failed to start meeting");
    }
  };

  const handleJoinMeeting = () => {
    const normalizedCode = meetingCode.trim();

    if (!normalizedCode) {
      setJoinError("Please enter a meeting link or meeting ID");
      return;
    }

    const meetingId = normalizedCode
      .replace(/^minutely:\/\/join\//i, "")
      .replace(/^https?:\/\/[^/]+\/join\//i, "")
      .replace(/^#\/join\//i, "")
      .replace(/^\/join\//i, "");

    if (!meetingId) {
      setJoinError("Please enter a valid meeting link or meeting ID");
      return;
    }

    navigate(`/join/${encodeURIComponent(meetingId)}`);
  };

  return (
    <section className="px-3 py-4 sm:px-4 sm:py-6 md:px-8 lg:px-12">

      <div className="flex justify-center pb-4 sm:pb-5">
        <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-7">
          <Input type="text" placeholder="Enter meeting link or meeting ID..." className="sm:col-span-5" value={meetingCode} onChange={(e) => {
            setMeetingCode(e.target.value);
            if (joinError) setJoinError("");
          }} />
          <Button variant="default" className="w-full sm:col-span-2" onClick={handleJoinMeeting}>
            Join
          </Button>
        </div>
      </div>

      {joinError && (
        <div className="flex justify-center pb-3">
          <div className="w-full max-w-2xl">
            <p className="text-sm text-destructive">{joinError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <Card className="w-full h-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Meeting Setup</CardTitle>
                <CardDescription>
                  Configure your meeting details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Meeting Title</Label>
              <Input placeholder="Enter meeting title..." value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Quick Note</Label>
              <Textarea
                placeholder="Add agenda, goals, or context for this session..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
              />
            </div>

            <Separator />

            <Label>Meeting Settings</Label>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Toggle variant="outline" pressed={mic} onPressedChange={setMic} className="flex w-full items-center gap-2 px-2">
                {mic ? <Microphone /> : <MicrophoneOff />} <span>Mic</span>
              </Toggle>
              <Toggle variant="outline" pressed={video} onPressedChange={setVideo} className="flex w-full items-center gap-2 px-2">
                {video ? <Video /> : <VideoOff />} <span>Video</span>
              </Toggle>
              <Toggle variant="outline" pressed={transcript} onPressedChange={setAITranscription} className="flex w-full items-center gap-2 px-2">
                {transcript ? <AITranscription /> : <AITranscriptionOff />} <span>Transcript</span>
              </Toggle>
              <Toggle variant="outline" pressed={notes} onPressedChange={setAINotes} className="flex w-full items-center gap-2 px-2">
                {notes ? <AINotes /> : <AINotesOff />} <span>Notes</span>
              </Toggle>
            </div>

            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <Label className="text-sm">Meeting type</Label>
                <Toggle variant="outline" pressed={isScheduled} onPressedChange={setIsScheduled} className="w-full justify-center sm:w-auto" >
                  <CalendarClock className="h-4 w-4" />
                  {isScheduled ? "Scheduled" : "Instant"}
                </Toggle>
              </div>

              {isScheduled ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meeting-date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-card hover:bg-muted/50 border-border/60",
                            !scheduledDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meeting-time">Time</Label>
                    <TimePicker value={scheduledTime} onChange={setScheduledTime} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The meeting will start immediately when you confirm.
                </p>
              )}
            </div>

            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm">Participants</Label>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="Enter participant email"
                    className="min-w-0"
                    value={participantEmail}
                    onChange={(e) => {
                      setParticipantEmail(e.target.value);
                      if (participantError) {
                        setParticipantError("");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addParticipantByEmail();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={addParticipantByEmail}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <AvatarGroup className="max-w-full overflow-x-auto">
                    {selectedParticipants.map((participant) => (
                      <Avatar key={participant.id}>
                        <AvatarFallback>
                          {participant.displayName
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {selectedParticipants.length === 0 && (
                      <Avatar>
                        <AvatarFallback>0</AvatarFallback>
                      </Avatar>
                    )}
                  </AvatarGroup>

                  <div className="flex items-center gap-1 text-left text-sm text-muted-foreground sm:text-right">
                    <span>{selectedParticipants.length} Participants</span>
                    <UserIcon />
                  </div>
                </div>

                {participantError && (
                  <p className="text-sm text-destructive">{participantError}</p>
                )}

                {selectedParticipants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex max-w-full items-center gap-2 rounded-full border bg-background py-1 pl-3 pr-1 text-sm"
                      >
                        <span className="max-w-[170px] truncate sm:max-w-[220px]">{participant.displayName}</span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeParticipant(participant.id)}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No participants added yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Ready To Start
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="h-4 w-4" />
                    Start Time
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isScheduled
                      ? scheduledDate && scheduledTime
                        ? `${scheduledDate} at ${scheduledTime}`
                        : "Pick a date and time before scheduling."
                      : "This meeting starts immediately when you confirm from the sheet."}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Attendees
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedParticipants.length} participant{selectedParticipants.length === 1 ? "" : "s"} added for this meeting.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {activeTools.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <Separator className="mt-6" />

            <Button className="w-full" onClick={handleCreateMeeting}>
              {isScheduled ? "Schedule Meeting" : "Start Instant Meeting"}
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full h-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>
                  Your upcoming sessions and quick join options
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {upcomingMeetings.length > 0 ? (
              <>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <Label className="text-sm">Next Up</Label>
                      <p className="text-sm text-muted-foreground">
                        Your nearest meeting is ready to review.
                      </p>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                      {upcomingMeetings[0]?.status}
                    </span>
                  </div>

                  <div className="rounded-xl border bg-background p-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-medium">{upcomingMeetings[0]?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {upcomingMeetings[0]?.time} · {upcomingMeetings[0]?.duration}
                        </p>
                      </div>
                      <Button size="sm" className="w-full sm:w-auto">
                        Join
                      </Button>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{upcomingMeetings[0]?.room}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{upcomingMeetings[0]?.attendees} attendees invited</span>
                      </div>
                    </div>
                  </div>
                </div>

                {upcomingMeetings.slice(1).length > 0 && (
                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <Label className="text-sm">More Upcoming</Label>
                      </div>
                      <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                        {upcomingMeetings.slice(1).length} more
                      </span>
                    </div>

                    <div className="space-y-3">
                      {upcomingMeetings.slice(1).map((meeting) => (
                      <div key={meeting.id} className="rounded-lg border p-3 transition hover:bg-muted/40" >
                        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {meeting.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {meeting.attendees} people
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full sm:w-auto"
                            variant={meeting.joinable ? "default" : "outline"}
                          >
                            {meeting.joinable ? "Join" : "View"}
                          </Button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {meeting.duration}
                          </span>
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {meeting.room}
                          </span>
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {meeting.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <CalendarClock className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium text-foreground">No upcoming meetings</p>
                <p className="text-sm mt-1">Schedule a meeting to see it here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <StartMeetingSheet
          open={openStartMeeting}
          onOpenChange={setOpenStartMeeting}
          meetingTitle={meetingTitle}
          onMeetingTitleChange={setMeetingTitle}
          quickNote={quickNote}
          onQuickNoteChange={setQuickNote}
          micEnabled={mic}
          onMicEnabledChange={setMic}
          videoEnabled={video}
          onVideoEnabledChange={setVideo}
          AINotesEnabled={notes}
          onAINotesEnabledChange={setAINotes}
          AITranscriptionEnabled={transcript}
          onAITranscriptionEnabledChange={setAITranscription}
          isScheduled={isScheduled}
          onIsScheduledChange={setIsScheduled}
          scheduledDate={scheduledDate}
          onScheduledDateChange={setScheduledDate}
          scheduledTime={scheduledTime}
          onScheduledTimeChange={setScheduledTime}
          participants={selectedParticipants}
        />

      </div>
    </section>
  )
}
