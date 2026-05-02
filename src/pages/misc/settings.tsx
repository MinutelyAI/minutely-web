import { useState } from "react"
import {
  Bell,
  Globe,
  Lock,
  Monitor,
  Moon,
  Palette,
  Sun,
  User,
} from "lucide-react"
import {
  Badge,
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Input,
  Label,
  Separator,
  Switch,
} from "@minutely/shared"
import { useTheme } from "../../contexts/theme-context"

export default function SettingsPage() {
  const userEmail = localStorage.getItem("user_email") || ""
  const userName = userEmail ? userEmail.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User"

  const { theme, setTheme } = useTheme()
  const [notifSound, setNotifSound] = useState(true)
  const [notifDesktop, setNotifDesktop] = useState(true)
  const [notifEmail, setNotifEmail] = useState(false)
  const [autoJoin, setAutoJoin] = useState(true)
  const [mirrorVideo, setMirrorVideo] = useState(true)

  return (
    <section className="flex flex-1 flex-col gap-5 p-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, preferences, and application settings.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar navigation */}
        <Card className="border border-border/60 bg-card/95 py-0 h-fit">
          <CardContent className="flex flex-col gap-1 p-3">
            {[
              { icon: User, label: "Profile", active: true },
              { icon: Palette, label: "Appearance", active: false },
              { icon: Bell, label: "Notifications", active: false },
              { icon: Monitor, label: "Meetings", active: false },
              { icon: Lock, label: "Privacy", active: false },
              { icon: Globe, label: "Language", active: false },
            ].map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="flex flex-col gap-5">
          {/* Profile section */}
          <Card className="border border-border/60 bg-card/95 py-0">
            <CardHeader className="border-b border-border/70 py-5">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profile</CardTitle>
              </div>
              <CardDescription>Your personal information and account details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 px-5 py-5">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {userName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{userName}</p>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                  <Badge variant="outline" className="mt-1.5">Free Plan</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input id="display-name" defaultValue={userName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={userEmail} disabled />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm">Save changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="border border-border/60 bg-card/95 py-0">
            <CardHeader className="border-b border-border/70 py-5">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-3">
                  {([
                    { value: "light" as const, icon: Sun, label: "Light" },
                    { value: "dark" as const, icon: Moon, label: "Dark" },
                    { value: "system" as const, icon: Monitor, label: "System" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        theme === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border border-border/60 bg-card/95 py-0">
            <CardHeader className="border-b border-border/70 py-5">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Choose how and when you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-5 py-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Sound alerts</Label>
                  <p className="text-sm text-muted-foreground">Play a sound when you receive a notification.</p>
                </div>
                <Switch checked={notifSound} onCheckedChange={setNotifSound} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Desktop notifications</Label>
                  <p className="text-sm text-muted-foreground">Show system-level notifications for meetings and messages.</p>
                </div>
                <Switch checked={notifDesktop} onCheckedChange={setNotifDesktop} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email summaries for missed meetings and action items.</p>
                </div>
                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
              </div>
            </CardContent>
          </Card>

          {/* Meeting defaults */}
          <Card className="border border-border/60 bg-card/95 py-0">
            <CardHeader className="border-b border-border/70 py-5">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                <CardTitle>Meeting Defaults</CardTitle>
              </div>
              <CardDescription>Default settings applied to every new meeting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-5 py-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto-join audio</Label>
                  <p className="text-sm text-muted-foreground">Automatically connect audio when joining a meeting.</p>
                </div>
                <Switch checked={autoJoin} onCheckedChange={setAutoJoin} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Mirror self-view</Label>
                  <p className="text-sm text-muted-foreground">Show your camera feed as a mirrored image.</p>
                </div>
                <Switch checked={mirrorVideo} onCheckedChange={setMirrorVideo} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
