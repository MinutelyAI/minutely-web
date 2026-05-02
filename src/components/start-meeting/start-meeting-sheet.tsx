import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, } from "@minutely/shared/ui"
import { Button } from "@minutely/shared/ui";
import { Label } from "@minutely/shared/ui";
import { Input } from "@minutely/shared/ui";
import { Textarea } from "@minutely/shared/ui";
import { MeetingParticipant, StartMeetingSheetProps } from "@/types";
import { Toggle } from "@minutely/shared/ui";
import {
  MicrophoneIcon as Microphone,
  MicrophoneSlashIcon as MicrophoneOff,
  VideoCameraIcon as Video,
  VideoCameraSlashIcon as VideoOff,
  SubtitlesIcon as AITranscription,
  SubtitlesSlashIcon as AITranscriptionOff,
  PencilSimpleSlashIcon as AINotesOff,
  PencilSimpleIcon as AINotes,
} from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@minutely/shared/ui";
import { Separator } from "@minutely/shared/ui";
import { Calendar } from "@minutely/shared/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@minutely/shared/ui";
import { TimePicker } from "@minutely/shared/ui";
import { CalendarIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@minutely/shared/utils";

export default function StartMeetingSheet({
  meetingTitle,
  onMeetingTitleChange,
  quickNote,
  onQuickNoteChange,
  micEnabled,
  onMicEnabledChange,
  videoEnabled,
  onVideoEnabledChange,
  AINotesEnabled,
  onAINotesEnabledChange,
  AITranscriptionEnabled,
  onAITranscriptionEnabledChange,
  isScheduled,
  onIsScheduledChange,
  scheduledDate,
  onScheduledDateChange,
  scheduledTime,
  onScheduledTimeChange,
  participants,

  open,
  onOpenChange,
}: StartMeetingSheetProps) {

  const noParticipants = () => participants.length === 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Start Meeting</SheetTitle>
          <SheetDescription>
            Review the meeting details before starting now.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="start-meeting-title">Meeting title</Label>
            <Input
              id="start-meeting-title"
              placeholder="Enter meeting title"
              value={meetingTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onMeetingTitleChange(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="start-meeting-notes">Quick note</Label>
            <Textarea
              id="start-meeting-notes"
              placeholder="Agenda or context"
              value={quickNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onQuickNoteChange(e.target.value)}
            />
          </div>
          <Separator />
          <Label>Meeting Settings</Label>

          <TooltipProvider>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger>
                  <Toggle
                    variant="outline"
                    pressed={micEnabled}
                    onPressedChange={onMicEnabledChange}
                  >
                    {micEnabled ? <Microphone /> : <MicrophoneOff />}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{micEnabled ? "Turn microphone off" : "Turn microphone on"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Toggle
                    variant="outline"
                    pressed={videoEnabled}
                    onPressedChange={onVideoEnabledChange}
                  >
                    {videoEnabled ? <Video /> : <VideoOff />}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{videoEnabled ? "Turn video off" : "Turn video on"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Toggle
                    variant="outline"
                    pressed={AITranscriptionEnabled}
                    onPressedChange={onAITranscriptionEnabledChange}
                  >
                    {AITranscriptionEnabled ? <AITranscription /> : <AITranscriptionOff />}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {AITranscriptionEnabled
                      ? "Disable AI transcription"
                      : "Enable AI transcription"}
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger >
                  <Toggle
                    variant="outline"
                    pressed={AINotesEnabled}
                    onPressedChange={onAINotesEnabledChange}
                  >
                    {AINotesEnabled ? <AINotes /> : <AINotesOff />}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{AINotesEnabled ? "Disable AI notes" : "Enable AI notes"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <Separator />
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Schedule</Label>
              <Toggle
                variant="outline"
                pressed={isScheduled}
                onPressedChange={onIsScheduledChange}
              >
                {isScheduled ? "Scheduled" : "Start Now"}
              </Toggle>
            </div>
            {isScheduled ? (
              <div className="grid gap-3 md:grid-cols-2">
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
                      onSelect={onScheduledDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <TimePicker value={scheduledTime} onChange={onScheduledTimeChange} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                The meeting will start as soon as you confirm.
              </p>
            )}
          </div>

          <Separator />
          <div className="grid gap-3">
            <Label>Participants</Label>
            <p className="text-sm text-muted-foreground">
              {participants.length === 0
                ? "No participants added. You can add participants after starting the meeting."
                : `${participants.length} participant${participants.length === 1 ? "" : "s"} added.`}
            </p>
          </div>
        </div>

        <Separator />

        <SheetFooter>
          <Button disabled={participants.length === 0} type="button">Start Now</Button>
          <SheetClose render={<Button variant="outline">Cancel</Button>} />
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
