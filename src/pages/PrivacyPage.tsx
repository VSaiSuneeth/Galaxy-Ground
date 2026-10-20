import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const PrivacyPage = () => (
  <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
    <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
    </Link>

    <div className="glass-panel p-6">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Privacy Policy</h1>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Galaxy Ground is a space community hub. This policy explains what data we collect,
          why we collect it, and how you can manage your information.
        </p>

        <h2 className="text-foreground font-semibold">Data We Collect</h2>
        <p>
          When you create an account we store your email address and profile information
          (username, display name, avatar). Posts, comments, likes, follows, and messages
          you create are stored to provide the service.
        </p>

        <h2 className="text-foreground font-semibold">How We Use Data</h2>
        <p>
          Your data is used only to operate Galaxy Ground: display your profile, show your
          posts in feeds, notify you of interactions, and let other users discover your
          content. We do not sell your data to third parties.
        </p>

        <h2 className="text-foreground font-semibold">Data Retention</h2>
        <p>
          You can delete your account and associated content at any time through your
          profile settings. Some residual data (e.g. comments on others' posts) may remain
          after account deletion to preserve thread context.
        </p>

        <h2 className="text-foreground font-semibold">Third-Party Services</h2>
        <p>
          Galaxy Ground uses Supabase for database and authentication. Your data is stored
          on Supabase infrastructure. We do not share data with advertising networks.
        </p>

        <h2 className="text-foreground font-semibold">Contact</h2>
        <p>
          If you have questions about this policy, please open an issue on our GitHub
          repository or contact the project maintainers.
        </p>

        <p className="text-xs text-muted-foreground/60 pt-4 border-t border-glass-border">
          Last updated: July 2026
        </p>
      </div>
    </div>
  </div>
);

export default PrivacyPage;
