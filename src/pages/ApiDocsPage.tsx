import { Link } from "react-router-dom";
import { ArrowLeft, Key, Shield, Activity } from "lucide-react";

const ApiDocsPage = () => (
  <div className="mx-auto max-w-3xl space-y-6 py-8 px-4">
    <Link to="/settings/messaging" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to settings
    </Link>

    <div className="glass-panel p-6">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
        <Activity className="h-5 w-5 text-primary" />
        OrbitalStack API
      </h1>
      <p className="text-sm text-muted-foreground">
        Programmatic access to Galaxy Ground's curated space data — launches, startups, and more.
      </p>
    </div>

    {/* Authentication */}
    <div className="glass-panel p-5">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
        <Key className="h-4 w-4 text-cyan-400" /> Authentication
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        All API requests require an API key passed via the <code className="bg-muted/30 px-1 rounded">X-API-Key</code> header.
        Generate a key from your <Link to="/settings/messaging" className="text-primary hover:underline">settings page</Link>.
      </p>
      <div className="bg-black/40 rounded-lg p-3 overflow-x-auto">
        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
{`curl -H "X-API-Key: gg_live_xxxxxxxxxxxx" \\
  "https://${import.meta.env.VITE_SUPABASE_URL?.replace("https://", "").replace(".supabase.co", "") || "your-project"}.supabase.co/functions/v1/api-gateway/v1/launches"`}
        </pre>
      </div>
    </div>

    {/* Rate Limits */}
    <div className="glass-panel p-5">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-cyan-400" /> Rate Limits
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-glass-border">
              <th className="text-left pb-2 font-medium">Tier</th>
              <th className="text-left pb-2 font-medium">Per Minute</th>
              <th className="text-left pb-2 font-medium">Per Day</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-glass-border/50">
              <td className="py-2 text-foreground">Free</td>
              <td className="py-2 text-muted-foreground">10 requests</td>
              <td className="py-2 text-muted-foreground">100 requests</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* Endpoints */}
    <div className="glass-panel p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">Endpoints</h2>

      <div className="space-y-4">
        {/* GET /v1/launches */}
        <div className="bg-black/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">GET</span>
            <code className="text-xs font-mono text-foreground">/v1/launches</code>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Returns a paginated list of space launches.</p>

          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Query Parameters</h4>
          <table className="w-full text-xs mb-3">
            <thead>
              <tr className="text-muted-foreground border-b border-glass-border">
                <th className="text-left pb-1 font-medium">Name</th>
                <th className="text-left pb-1 font-medium">Type</th>
                <th className="text-left pb-1 font-medium">Default</th>
                <th className="text-left pb-1 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="py-1 text-foreground">page</td><td className="py-1 text-muted-foreground">int</td><td className="py-1 text-muted-foreground">1</td><td className="py-1 text-muted-foreground">Page number</td></tr>
              <tr><td className="py-1 text-foreground">page_size</td><td className="py-1 text-muted-foreground">int</td><td className="py-1 text-muted-foreground">20</td><td className="py-1 text-muted-foreground">Items per page (max 100)</td></tr>
              <tr><td className="py-1 text-foreground">status</td><td className="py-1 text-muted-foreground">string</td><td className="py-1 text-muted-foreground">—</td><td className="py-1 text-muted-foreground">Filter by status (e.g. "scheduled")</td></tr>
              <tr><td className="py-1 text-foreground">provider</td><td className="py-1 text-muted-foreground">string</td><td className="py-1 text-muted-foreground">—</td><td className="py-1 text-muted-foreground">Filter by provider name (partial match)</td></tr>
            </tbody>
          </table>

          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Example Response</h4>
          <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap bg-black/30 rounded p-2 overflow-x-auto">
{`{
  "data": [
    {
      "id": "uuid",
      "slug": "isro-gaganyaan-g1",
      "name": "Gaganyaan G1",
      "provider": "ISRO",
      "mission_type": "crewed",
      "launch_date": "2026-07-15T04:30:00Z",
      "location": "Satish Dhawan Space Centre, India",
      "vehicle": "LVM3",
      "payload": "Uncrewed orbital test flight",
      "status": "scheduled",
      "description": "Uncrewed flight test...",
      "image_url": null
    }
  ],
  "meta": {
    "count": 1,
    "page": 1,
    "page_size": 20,
    "source": "galaxy_ground_v1",
    "last_synced": "2026-07-09T12:00:00Z"
  }
}`}
          </pre>
        </div>
      </div>
    </div>

    {/* Error Codes */}
    <div className="glass-panel p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">Error Codes</h2>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-b border-glass-border">
            <th className="text-left pb-2 font-medium">Status</th>
            <th className="text-left pb-2 font-medium">Code</th>
            <th className="text-left pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-glass-border/50"><td className="py-2">401</td><td className="py-2 text-muted-foreground">Invalid API key</td><td className="py-2 text-muted-foreground">The X-API-Key header is missing or the key is invalid/revoked</td></tr>
          <tr className="border-b border-glass-border/50"><td className="py-2">429</td><td className="py-2 text-muted-foreground">Rate limit exceeded</td><td className="py-2 text-muted-foreground">Too many requests. Check Retry-After header</td></tr>
          <tr className="border-b border-glass-border/50"><td className="py-2">404</td><td className="py-2 text-muted-foreground">Not found</td><td className="py-2 text-muted-foreground">The requested endpoint does not exist</td></tr>
          <tr className="border-b border-glass-border/50"><td className="py-2">405</td><td className="py-2 text-muted-foreground">Method not allowed</td><td className="py-2 text-muted-foreground">The HTTP method is not supported for this endpoint</td></tr>
          <tr><td className="py-2">500</td><td className="py-2 text-muted-foreground">Internal server error</td><td className="py-2 text-muted-foreground">An unexpected error occurred on the server</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default ApiDocsPage;
