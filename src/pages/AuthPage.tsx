import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import StarField from "@/components/StarField";
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

        toast.success("Account created! Welcome to Galaxy Ground 🚀");
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

      toast.success("Welcome back, explorer 🌌");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(formatAuthError(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-gradient relative flex items-center justify-center p-4">
      <StarField />
      <div className="glass-panel-strong p-8 w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <Rocket className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold glow-text text-foreground">Galaxy Ground</span>
        </Link>

        <h1 className="text-2xl font-bold text-foreground text-center mb-1">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Join the mission" : "Reset your password"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {mode === "signin" ? "Sign in to your cosmic account" : mode === "signup" ? "Create your explorer profile" : "Enter your email to receive a password reset link"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-muted/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-muted/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
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
                className="w-full bg-muted/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
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
              className="w-full bg-muted/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
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
  );
};

export default AuthPage;