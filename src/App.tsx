import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { MeetingProvider } from "./contexts/meeting-context";
import { ThemeProvider } from "./contexts/theme-context";
import { AppLayout, AuthLayout } from "./layouts/app-layout";
import { Toaster } from "sonner";

// Pages
import Login from "./pages/login";
import Signup from "./pages/signup";
import MeetingsLayout from "./pages/meetings/layout";
import MeetingsDashboard from "./pages/meetings/meetings";
import StartMeetingPage from "./pages/meetings/start-meeting";
import MeetingNotesPage from "./pages/meetings/meeting-notes";
import CalenderPage from "./pages/meetings/calender";
import ChatPage from "./pages/chat/chat";
import TeamChatPage from "./pages/chat/team";
import GroupsChatPage from "./pages/chat/groups";
import SettingsPage from "./pages/misc/settings";
import ArchivePage from "./pages/misc/archive";
import TrashPage from "./pages/misc/trash";
import JoinMeetingPage from "./pages/meetings/join-meeting";
import ActiveMeetingPage from "./pages/meetings/active-meeting";

/**
 * Root layout that wraps the entire app tree with providers.
 * Must be inside the router so that useNavigate() works in AuthProvider.
 */
function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MeetingProvider>
          <Toaster position="bottom-right" richColors />
          <Outlet />
        </MeetingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

/** Dashboard shell — just renders child routes */
function DashboardOutlet() {
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public auth routes
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <Login /> },
          { path: "/signup", element: <Signup /> },
        ],
      },
      // Protected app routes
      {
        element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <DashboardOutlet />,
            children: [
              { index: true, element: <Navigate to="/meetings" replace /> },
              {
                path: "meetings",
                element: <MeetingsLayout />,
                children: [
                  { index: true, element: <MeetingsDashboard /> },
                  { path: "start-meetings", element: <StartMeetingPage /> },
                  { path: "active-meeting", element: <ActiveMeetingPage /> },
                  { path: "meetings-notes", element: <MeetingNotesPage /> },
                  { path: "calender", element: <CalenderPage /> },
                ],
              },
              {
                path: "chat",
                element: <ChatPage />,
                children: [
                  { path: "team", element: <TeamChatPage /> },
                  { path: "groups", element: <GroupsChatPage /> },
                ],
              },
              { path: "settings", element: <SettingsPage /> },
              { path: "archive", element: <ArchivePage /> },
              { path: "trash", element: <TrashPage /> },
              { path: "join/:meetingId", element: <JoinMeetingPage /> },
            ],
          },
          { path: "/dashboard", element: <Navigate to="/meetings" replace /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
