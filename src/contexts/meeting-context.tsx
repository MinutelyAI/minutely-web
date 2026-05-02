import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { ActiveMeeting, ScheduledMeeting } from '../types';
import { useAuth } from './auth-context';

type MeetingContextType = {
  activeMeeting: ActiveMeeting | null;
  scheduledMeetings: ScheduledMeeting[];
  createMeeting: (meeting: ActiveMeeting) => void;
  scheduleMeeting: (meeting: ScheduledMeeting) => Promise<void>;
  endMeeting: (forAll: boolean) => void;
  updateMeeting: (updates: Partial<ActiveMeeting>) => void;
};

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const { api } = useAuth();
  const [activeMeeting, setActiveMeeting] = useState<ActiveMeeting | null>(null);
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>([]);

  // Load scheduled meetings from the API on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    api.getNextMeeting()
      .then((res) => res.json())
      .then((json) => {
        if (json && json.data) {
          const m = json.data;
          setScheduledMeetings([{
            id: m.id,
            title: m.title,
            category: 'Internal',
            scheduledAt: new Date(m.scheduled_for),
            meeting: {
              id: m.id,
              title: m.title,
              dateLabel: new Date(m.scheduled_for).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              }),
              timeRange: new Date(m.scheduled_for).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              }),
              duration: '30 min',
              location: 'Virtual',
              organizer: 'You',
              participants: [],
              summary: m.notes ?? '',
            },
          }]);
        }
      })
      .catch(console.error);
  }, []);

  const createMeeting = useCallback((meeting: ActiveMeeting) => {
    setActiveMeeting(meeting);
  }, []);

  // Posts to the API and updates local state on success
  const scheduleMeeting = useCallback(async (meeting: ScheduledMeeting) => {
    const scheduledAt = meeting.scheduledAt instanceof Date
      ? meeting.scheduledAt
      : new Date(meeting.scheduledAt);

    const response = await api.scheduleMeeting({
      title: meeting.title,
      description: meeting.meeting?.summary ?? '',
      scheduled_for: scheduledAt.toISOString(),
      participants: meeting.meeting?.participants?.map((p) => p.email) ?? [],
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to schedule meeting');
    }

    // Update local state so the calendar reflects it immediately
    setScheduledMeetings((current) => [...current, meeting]);
  }, [api]);

  const endMeeting = useCallback((forAll: boolean) => {
    if (activeMeeting) {
      if (forAll) {
        setActiveMeeting(null);
      } else {
        console.log('User left meeting:', activeMeeting.id);
      }
    }
  }, [activeMeeting]);

  const updateMeeting = useCallback((updates: Partial<ActiveMeeting>) => {
    setActiveMeeting((prev) =>
      prev ? { ...prev, ...updates } : null
    );
  }, []);

  const contextValue = useMemo(() => ({
    activeMeeting,
    scheduledMeetings,
    createMeeting,
    scheduleMeeting,
    endMeeting,
    updateMeeting,
  }), [activeMeeting, scheduledMeetings, createMeeting, scheduleMeeting, endMeeting, updateMeeting]);

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within MeetingProvider');
  }
  return context;
}
