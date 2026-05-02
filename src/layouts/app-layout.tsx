import { Fragment } from "react";
import { Outlet, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import {
  CalendarDays,
  LogOut,
  MessageSquare,
  Settings,
  Archive,
  Trash,
  Video,
} from "lucide-react";
import {
  Button,
  Separator,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@minutely/shared";

const navItems = [
  { label: "Meetings", to: "/meetings", icon: Video },
  { label: "Chat", to: "/chat", icon: MessageSquare },
  { label: "Calendar", to: "/meetings/calender", icon: CalendarDays },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Archive", to: "/archive", icon: Archive },
  { label: "Trash", to: "/trash", icon: Trash },
];

function AppSidebar() {
  const { logout, userEmail } = useAuth();
  const { pathname } = useLocation();
  const userName = userEmail
    ? userEmail.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "User";

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-card/95">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/60">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {userName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-3 py-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function AppLayout() {
  const { token } = useAuth();
  const { pathname } = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const breadcrumbs = (() => {
    switch (pathname) {
      case "/":
        return [];
      case "/meetings":
        return [{ label: "Meetings" }];
      case "/meetings/start-meetings":
        return [
          { label: "Meetings", to: "/meetings" },
          { label: "Start Meeting" },
        ];
      case "/meetings/meetings-notes":
        return [
          { label: "Meetings", to: "/meetings" },
          { label: "Meeting Notes" },
        ];
      case "/meetings/calender":
        return [
          { label: "Meetings", to: "/meetings" },
          { label: "Calendar" },
        ];
      case "/chat":
        return [{ label: "Chat" }];
      case "/chat/team":
        return [
          { label: "Chat", to: "/chat" },
          { label: "Team Chat" },
        ];
      case "/chat/groups":
        return [
          { label: "Chat", to: "/chat" },
          { label: "Groups" },
        ];
      case "/settings":
        return [{ label: "Settings" }];
      case "/archive":
        return [{ label: "Archive" }];
      case "/trash":
        return [{ label: "Trash" }];
      default:
        return [];
    }
  })();

  return (
    <div className="flex h-svh bg-background text-foreground">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-auto">
        <header className="flex h-14 shrink-0 items-center border-b border-border/60 px-5">
          {breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <Fragment key={`${crumb.label}-${index}`}>
                      <BreadcrumbItem>
                        {isLast || !crumb.to ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink render={<Link to={crumb.to} />}>
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AuthLayout() {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/meetings" replace />;
  }

  return (
    <main className="min-h-svh flex items-center justify-center bg-background text-foreground p-4">
      <Outlet />
    </main>
  );
}
