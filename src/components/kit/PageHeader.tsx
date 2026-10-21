import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  back?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, eyebrow, subtitle, back, actions }: PageHeaderProps) => (
  <header className="border-b border-border pb-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        {back && <Link to={back} className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>}
        {eyebrow && <p className="telemetry mb-1">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  </header>
);

export default PageHeader;
