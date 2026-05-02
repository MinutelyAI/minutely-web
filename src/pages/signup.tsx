import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Field, FieldDescription, FieldGroup, FieldLabel,
  Input,
} from "@minutely/shared";
import { useAuth } from "../contexts/auth-context";

export default function Signup() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    if (!form.name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await api.signup({
        email: form.email,
        password: form.password,
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Signup error response:", data);
        setError(data.error || data.message || "Failed to create account");
        return;
      }

      setSuccess(true);
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Redirect to login so user obtains a valid access token
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-green-500/50 bg-green-50 p-3 text-sm text-green-700">
                Account created successfully! Redirecting...
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={form.name}
                onChange={handleChange}
                disabled={loading}
              />
            </Field>
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
              <FieldDescription>
                {"We'll use this to contact you. We will not share your email with anyone else."}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                disabled={loading}
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
              <FieldDescription>
                Please confirm your password.
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={loading || success} className="flex items-center gap-2">
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  {loading ? "Creating..." : success ? "Account Created!" : "Create Account"}
                </Button>
                <FieldDescription className="px-6 text-center" onClick={() => navigate("/login")}>
                  Already have an account? <a className="font-semibold hover:underline cursor-pointer">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
