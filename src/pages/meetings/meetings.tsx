import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  Loader2,
  MapPin,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useMeeting } from "../../contexts/meeting-context"
import { useAuth } from "../../contexts/auth-context"
import {
  Badge,
  Button,
  Calendar,
  Popover, PopoverContent, PopoverTrigger,
  Input,
  Label,
  Textarea,
  Separator,
  TimePicker,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@minutely/shared"
import { cn } from "@minutely/shared/utils"
import { format } from "date-fns"

type ApiMeeting = {
  id: string
  title: string
  status: string
  scheduled_for: string
  created_at: string
}

export default function MeetingsDashboard() {
  const { scheduleMeeting } = useMeeting()
  const { api } = useAuth()

  const [scheduleTitle, setScheduleTitle] = useState("")
  const [scheduleDescription, setScheduleDescription] = useState("")
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined)
  const [scheduleTime, setScheduleTime] = useState("")
  const [inviteeEmail, setInviteeEmail] = useState("")
  const [invitees, setInvitees] = useState<string[]>([])
  const [scheduleError, setScheduleError] = useState("")
  const [scheduleSuccess, setScheduleSuccess] = useState("")

  // Dynamic dashboard data
  const [upcomingMeeting, setUpcomingMeeting] = useState<ApiMeeting | null>(null)
  const [recentMeetings, setRecentMeetings] = useState<ApiMeeting[]>([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)

  useEffect(() => {
    // Fetch upcoming meeting
    api.getNextMeeting()
      .then((res) => res.json())
      .then((json) => {
        if (json && json.data) setUpcomingMeeting(json.data)
      })
      .catch(console.error)
      .finally(() => setLoadingUpcoming(false))

    // Fetch recent meetings
    api.getRecentMeetings()
      .then((res) => res.json())
      .then((json) => {
        if (json && json.data && Array.isArray(json.data)) setRecentMeetings(json.data)
      })
      .catch(console.error)
      .finally(() => setLoadingRecent(false))
  }, [])

  const addInvitee = () => {
    const email = inviteeEmail.trim().toLowerCase()

    if (!email) {
      setScheduleError("Enter an invitee email before adding.")
      return
    }

    if (!email.includes("@")) {
      setScheduleError("Enter a valid email address.")
      return
    }

    if (invitees.includes(email)) {
      setScheduleError("That invitee has already been added.")
      return
    }

    setInvitees((current) => [...current, email])
    setInviteeEmail("")
    setScheduleError("")
  }

  const removeInvitee = (email: string) => {
    setInvitees((current) => current.filter((item) => item !== email))
    setScheduleError("")
  }

  const handleScheduleMeeting = async () => {
    if (!scheduleTitle.trim() || !scheduleDescription.trim() || !scheduleDate || !scheduleTime) {
      setScheduleError("Please complete title, description, date, and time.")
      setScheduleSuccess("")
      return
    }

    if (invitees.length === 0) {
      setScheduleError("Add at least one invitee before scheduling.")
      setScheduleSuccess("")
      return
    }

    const dateString = format(scheduleDate, "yyyy-MM-dd")
    const scheduledAt = new Date(`${dateString}T${scheduleTime}`)

    try {
      await scheduleMeeting({
        id: Date.now(),
        title: scheduleTitle.trim(),
        category: "Internal",
        scheduledAt,
        meeting: {
          id: Date.now(),
          title: scheduleTitle.trim(),
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
          participants: invitees.map((email, index) => ({
            id: Date.now() + index,
            displayName: email.split("@")[0],
            email,
            username: email.split("@")[0],
          })),
          summary: scheduleDescription.trim(),
        },
      })

      toast.success("Meeting scheduled successfully!")
      setScheduleSuccess("Meeting scheduled successfully.")
      setScheduleError("")
      setScheduleTitle("")
      setScheduleDescription("")
      setScheduleDate(undefined)
      setScheduleTime("")
      setInvitees([])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to schedule meeting"
      setScheduleError(msg)
      toast.error(msg)
    }
  }

  const formatApiDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })
  }
  const formatApiTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }

  return (
    <section className="flex flex-1 flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card className="border border-border/60 bg-card/95 py-0">
          <CardHeader className="border-b border-border/70 bg-gradient-to-r from-background via-primary/5 to-background py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge className="w-fit rounded-full px-3 py-1">Meeting Workspace</Badge>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Run meetings and keep the follow-up visible.</CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-6">
                    Start a live room, review generated notes, and keep the next actions moving without
                    bouncing between screens.
                  </CardDescription>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/meetings/start-meetings">
                    Start instant meeting
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/meetings/meetings-notes">Open notes</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/meetings/calender">View calendar</Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Upcoming</p>
              <p className="mt-2 text-3xl font-semibold">{upcomingMeeting ? 1 : 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">Meetings queued across today and tomorrow.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recent</p>
              <p className="mt-2 text-3xl font-semibold">{recentMeetings.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">Completed sessions from your history.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
              <p className="mt-2 text-3xl font-semibold">{recentMeetings.length + (upcomingMeeting ? 1 : 0)}</p>
              <p className="mt-2 text-sm text-muted-foreground">All meetings tracked in your workspace.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/95 py-0">
          <CardHeader className="border-b border-border/70 py-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Today at a glance
            </CardTitle>
            <CardDescription>What needs attention before the next handoff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-muted/35 p-6 text-center text-sm leading-6 text-muted-foreground">
              <Sparkles className="h-8 w-8 mb-2 opacity-20" />
              You're all caught up for today.
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <CardTitle className="text-base">Schedule meeting</CardTitle>
                <CardDescription>Book a meeting time that appears on the calendar.</CardDescription>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="schedule-title">Title</Label>
                  <Input
                    id="schedule-title"
                    placeholder="Meeting title"
                    value={scheduleTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduleTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="schedule-description">Description</Label>
                  <Textarea
                    id="schedule-description"
                    placeholder="Meeting description"
                    value={scheduleDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScheduleDescription(e.target.value)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background hover:bg-muted/50 border-border/60",
                            !scheduleDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {scheduleDate ? format(scheduleDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduleDate}
                          onSelect={setScheduleDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <TimePicker value={scheduleTime} onChange={setScheduleTime} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="invitee-email">Invitees</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="invitee-email"
                      placeholder="Enter invitee email"
                      value={inviteeEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteeEmail(e.target.value)}
                    />
                    <Button type="button" className="w-full sm:w-auto" onClick={addInvitee}>
                      Add
                    </Button>
                  </div>
                  {invitees.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {invitees.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center rounded-full border border-border/70 bg-background px-3 py-1 text-sm"
                        >
                          {email}
                          <button
                            type="button"
                            className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted"
                            onClick={() => removeInvitee(email)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {scheduleError && (
                  <p className="text-sm text-destructive">{scheduleError}</p>
                )}
                {scheduleSuccess && (
                  <p className="text-sm text-success">{scheduleSuccess}</p>
                )}

                <Button onClick={handleScheduleMeeting}>Schedule meeting</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/95 py-0">
          <CardHeader className="border-b border-border/70 py-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle>Upcoming meetings</CardTitle>
                <CardDescription>Fast access to the sessions that are next in line.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
                <Link to="/meetings/calender">
                  Calendar
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4">
            {loadingUpcoming ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingMeeting ? (
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold">{upcomingMeeting.title}</p>
                      <Badge variant="outline">{upcomingMeeting.status}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{formatApiDate(upcomingMeeting.scheduled_for)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        <span>{formatApiTime(upcomingMeeting.scheduled_for)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Virtual</span>
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link to="/meetings/start-meetings">Open room</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <CalendarDays className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-base font-medium text-foreground">No upcoming meetings</p>
                <p className="text-sm mt-1">Schedule a meeting to see it here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/95 py-0">
          <CardHeader className="border-b border-border/70 py-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle>Recent meetings</CardTitle>
                <CardDescription>Your completed sessions and their details.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
                <Link to="/meetings/meetings-notes">
                  All meetings
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4">
            {loadingRecent ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentMeetings.length > 0 ? (
              recentMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="rounded-2xl border border-border/70 bg-background p-4 transition hover:bg-muted/30"
                >
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-2">
                      <Badge variant="outline">{meeting.status}</Badge>
                      <div>
                        <p className="font-semibold">{meeting.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {formatApiDate(meeting.scheduled_for)} • {formatApiTime(meeting.scheduled_for)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <ClipboardList className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-base font-medium text-foreground">No recent meetings</p>
                <p className="text-sm mt-1">Your completed meetings will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
