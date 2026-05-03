export type StartMeetingSheetProps = {
  meetingTitle: string;
  onMeetingTitleChange: (value: string) => void;
  quickNote: string;
  onQuickNoteChange: (value: string) => void;
  micEnabled: boolean;
  onMicEnabledChange: (value: boolean) => void;
  videoEnabled: boolean;
  onVideoEnabledChange: (value: boolean) => void;
  AITranscriptionEnabled: boolean;
  onAITranscriptionEnabledChange: (value: boolean) => void;
  AINotesEnabled: boolean;
  onAINotesEnabledChange: (value: boolean) => void;
  isScheduled: boolean;
  onIsScheduledChange: (value: boolean) => void;
  scheduledDate: Date | undefined;
  onScheduledDateChange: (value: Date | undefined) => void;
  scheduledTime: string;
  onScheduledTimeChange: (value: string) => void;
  participants: MeetingParticipant[];

  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type Meeting = {
  id: number
  title: string
  dateLabel: string
  timeRange: string
  duration: string
  location: string
  organizer: string
  participants: MeetingParticipant[]
  summary: string
}

export type ScheduledMeeting = {
  id: number
  title: string
  category: "Internal" | "Client" | "Leadership"
  meeting: Meeting
  scheduledAt: Date
}

export type MeetingNoteSection = {
  title: string
  items: string[]
}

export type MeetingActionItem = {
  id: number
  title: string
  owner: string
  dueDate: string
  completed: boolean
  status: "open" | "completed"
}

export type MeetingNotes = {
  id: number
  title: string
  tags: string[]
  category: "Internal" | "Client" | "Leadership"
  meeting: Meeting
  sections: MeetingNoteSection[]
  actionItems: MeetingActionItem[]
  decisions: string[]
  highlights: string[]
}

export type Nav = {
  title: string
  url?: string
  icon: React.ComponentType
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export type User = {
  name: string
  email: string
  avatar: string
}

export type MeetingParticipant = {
  id: number
  displayName: string
  email: string
  username: string
}

export type NotificationItem = {
  id: number
  title: string
  description: string
  timeLabel: string
  unread: boolean
  tone: "info" | "success" | "warning"
}

export type ActiveMeeting = {
  id: string
  code: string
  title: string
  hostId: number
  participants: MeetingParticipant[]
  settings: {
    microphone: boolean
    video: boolean
    aiTranscription: boolean
    aiNotes: boolean
  }
  quickNote: string
  startTime: Date
  isScheduled: boolean
  scheduledStartTime?: Date
  status: "active" | "paused" | "ended"
}

export type MeetingEndRequest = {
  meetingId: string
  endedBy: "host" | "participant"
  forAll: boolean
  timestamp: Date
}
