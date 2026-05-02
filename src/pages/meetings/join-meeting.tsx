import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ActiveMeetingPage from "@/pages/meetings/active-meeting";
import { useMeeting } from "@/contexts/meeting-context";
import { getMeetingPeerEmail } from "@/lib/participant-identity";
import type { ActiveMeeting } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@minutely/shared/ui";
import { Button } from "@minutely/shared/ui";
import { minutelyApi } from "@/lib/api-client";

export default function JoinMeetingPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { activeMeeting, createMeeting } = useMeeting();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinMeeting = async () => {
      if (!meetingId) {
        setError("Missing meeting ID.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const email = getMeetingPeerEmail(localStorage.getItem("user_email"));
      if (!token || !email) {
        setError("Please login first to join and sync participant audio/video.");
        setLoading(false);
        return;
      }

      try {
        const response = await minutelyApi.validateMeeting(meetingId);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "Unable to join meeting");
        }

        const meeting = data.meeting;
        const participantResponse = await minutelyApi.updateParticipantState({
          meeting_id: String(meeting.id),
          email,
          has_joined: true,
          audio_enabled: true,
          video_enabled: true,
        });

        if (!participantResponse.ok) {
          if (participantResponse.status === 401) {
            localStorage.removeItem("token");
            setError("Session expired or invalid for this backend. Please login again and re-open the meeting link.");
            setLoading(false);
            return;
          }

          const message = await participantResponse.text();
          throw new Error(message || "Failed to register participant state");
        }

        const joinedMeeting: ActiveMeeting = {
          id: String(meeting.id),
          code: String(meeting.id),
          title: meeting.title || "Meeting",
          hostId: 1,
          participants: [],
          settings: {
            microphone: true,
            video: true,
            aiTranscription: false,
            aiNotes: false,
          },
          quickNote: "",
          startTime: new Date(),
          isScheduled: Boolean(meeting.scheduled_for),
          scheduledStartTime: meeting.scheduled_for ? new Date(meeting.scheduled_for) : undefined,
          status: "active",
        };

        createMeeting(joinedMeeting);

        setLoading(false);
      } catch (joinError) {
        setError(joinError instanceof Error ? joinError.message : "Unable to join meeting");
        setLoading(false);
      }
    };

    joinMeeting();
  }, [meetingId, createMeeting]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Joining meeting</CardTitle>
            <CardDescription>Validating the meeting link and opening the room.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unable to join</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/meetings/start-meetings", { replace: true })}>
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return activeMeeting ? <ActiveMeetingPage /> : null;
}
