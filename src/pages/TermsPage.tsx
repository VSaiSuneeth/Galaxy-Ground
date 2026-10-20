import { Link } from "react-router-dom";
import { ArrowLeft, Scale } from "lucide-react";

const TermsPage = () => (
  <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
    <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
    </Link>

    <div className="glass-panel p-6">
      <div className="mb-6 flex items-center gap-3">
        <Scale className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Terms of Service</h1>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          By using Galaxy Ground you agree to these terms. If you do not agree, do not
          use the service.
        </p>

        <h2 className="text-foreground font-semibold">Acceptable Use</h2>
        <p>
          You agree to use Galaxy Ground lawfully and respectfully. You may not post
          content that is illegal, harassing, abusive, or violates the rights of others.
          You retain ownership of content you post, but grant Galaxy Ground a license to
          display it within the service.
        </p>

        <h2 className="text-foreground font-semibold">Account Responsibility</h2>
        <p>
          You are responsible for maintaining the confidentiality of your login credentials
          and for all activity under your account. Notify us immediately of any unauthorized
          use.
        </p>

        <h2 className="text-foreground font-semibold">Service Availability</h2>
        <p>
          Galaxy Ground is provided &ldquo;as is&rdquo; without warranty. We strive for high
          availability but do not guarantee uninterrupted service. We may modify or
          discontinue features with reasonable notice.
        </p>

        <h2 className="text-foreground font-semibold">Limitation of Liability</h2>
        <p>
          Galaxy Ground and its contributors are not liable for indirect, incidental, or
          consequential damages arising from your use of the service.
        </p>

        <h2 className="text-foreground font-semibold">Changes</h2>
        <p>
          These terms may be updated. Continued use after changes constitutes acceptance
          of the new terms.
        </p>

        <p className="text-xs text-muted-foreground/60 pt-4 border-t border-glass-border">
          Last updated: July 2026
        </p>
      </div>
    </div>
  </div>
);

export default TermsPage;
