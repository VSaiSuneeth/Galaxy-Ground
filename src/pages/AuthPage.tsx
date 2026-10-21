import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { formatAuthError } from "@/lib/supabase-env";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const uname = username.trim() || email.split("@")[0];
        const dname = displayName.trim() || uname;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: uname,
              display_name: dname,
            },
          },
        });

        if (error) throw error;

        // Profile is created by DB trigger `handle_new_user` on auth.users insert.
        // Do NOT insert into profiles here — duplicate/wrong-id inserts break signup.

        if (!data.session) {
          toast.success("Account created! Check your email to confirm, then sign in.");
          setMode("signin");
          return;
        }

        toast.success("Account created");
        navigate("/", { replace: true });
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`
        });

        if (error) throw error;

        toast.success("Check your email for a reset link");
        setMode("signin");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error("Sign in succeeded but no session was returned.");

      toast.success("Signed in");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(formatAuthError(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 lg:grid lg:grid-cols-2 lg:p-0">
      <section className="hidden border-r border-border bg-card p-12 lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2"><LogoMark size={32} /><Wordmark /></Link>
        <div>
          <p className="telemetry mb-3">Ground control</p>
          <h1 className="max-w-md font-display text-5xl font-semibold leading-tight">Your ground station for everything space.</h1>
          <p className="mt-5 max-w-md text-muted-foreground">Follow launches, live activity and the people building what comes next.</p>
        </div>
        <p className="telemetry">Look up. Stay in the loop.</p>
      </section>
      <div className="flex items-center justify-center lg:p-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-7 sm:p-8">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <LogoMark size={28} />
          <Wordmark />
        </Link>

        <h2 className="font-display text-3xl font-semibold text-foreground text-center mb-1">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {mode === "signin" ? "Sign in to pick up where you left off." : mode === "signup" ? "Join the people tracking every launch." : "Enter your email to receive a password reset link."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-input bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-input bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </>
          )}
          {mode !== "forgot" && (
            <>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </>
          )}
          {mode === "forgot" && (
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
            />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-primary-foreground hover:bg-brand/90 transition-colors disabled:opacity-60"
          >
            {submitting ? "Please wait…" :
             mode === "signin" ? "Sign in" :
             mode === "signup" ? "Create account" :
             "Send reset link"}
          </button>
        </form>

        <div className="space-y-2 text-xs text-muted-foreground text-center mt-6">
          {mode === "signin" && (
            <>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-primary hover:underline"
              >
                Forgot password?
              </button>
              <p>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary hover:underline"
                >
                  Create an account
                </button>
              </p>
            </>
          )}
          {mode === "forgot" && (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AuthPage;
