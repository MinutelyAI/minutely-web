import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Field, FieldDescription, FieldGroup, FieldLabel,
  Input,
} from "@minutely/shared";
import { useAuth } from "../contexts/auth-context";

export default function Login() {
  const { api, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm({
      ...form,
      [id]: value,
    });
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!form.password) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.login({
        email: form.email,
        password: form.password,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Failed to login");
        return;
      }

      // Store auth token
      const token = data.token || data.access_token;
      if (!token) {
        setError("Login succeeded but no access token was returned");
        return;
      }

      login(token, form.email.trim().toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="flex items-center gap-2 rounded-md border bg-destructive/5 p-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                required
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                disabled={loading}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {loading ? "Logging in..." : "Login"}
              </Button>
              <FieldDescription className="text-center" onClick={() => navigate("/signup")}>
                Don&apos;t have an account? <a className="font-semibold hover:underline cursor-pointer">Sign up</a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
