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

export type MeetingParticipant = {
  id: number
  displayName: string
  email: string
  username: string
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

export type NotificationItem = {
  id: number
  title: string
  description: string
  timeLabel: string
  unread: boolean
  tone: "info" | "success" | "warning"
}
