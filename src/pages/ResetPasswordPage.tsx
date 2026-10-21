import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatAuthError } from "@/lib/supabase-env";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";

type PageState = "checking" | "ready" | "error";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("checking");
  const [errorMessage, setErrorMessage] = useState(
    "Invalid or expired reset link. Please request a new password reset."
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const errDesc = params.get("error_description");
      const errCode = params.get("error_code");
      if (errDesc || errCode) {
        const desc = errDesc
          ? decodeURIComponent(errDesc.replace(/\+/g, " "))
          : "Invalid or expired reset link. Please request a new password reset.";
        setErrorMessage(desc);
        setPageState("error");
        return;
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setPageState("ready");
        if (window.location.hash) {
          window.location.hash = "";
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState("ready");
        if (window.location.hash) {
          window.location.hash = "";
        }
      }
    });

    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPageState("ready");
        if (window.location.hash) {
          window.location.hash = "";
        }
      } else {
        setPageState((prev) => {
          if (prev === "checking") return "error";
          return prev;
        });
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Invalid or expired reset link. Please request a new password reset."
        );
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password updated. Please sign in with your new password.");
      navigate("/auth", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update password";
      toast.error(formatAuthError(message));
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (pageState === "checking") {
      return (
        <div className="text-center py-8">
          <div className="animate-pulse text-muted-foreground">
            Checking recovery session…
          </div>
        </div>
      );
    }

    if (pageState === "error") {
      return (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {errorMessage}
          </p>
          <Link
            to="/auth"
            className="inline-block py-2.5 px-6 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Request new reset link
          </Link>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          required
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
          minLength={6}
        />
        <input
          type="password"
          required
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
          minLength={6}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-primary-foreground hover:bg-brand/90 transition-colors disabled:opacity-60"
        >
          {submitting ? "Updating…" : "Update Password"}
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <Link
          to="/auth"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="flex items-center justify-center gap-2 mb-6">
          <LogoMark size={28} />
          <Wordmark />
        </div>

        <h1 className="font-display text-3xl font-semibold text-foreground text-center mb-1">
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {pageState === "ready"
            ? "Enter your new password below"
            : "Password Recovery"}
        </p>

        {renderContent()}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
