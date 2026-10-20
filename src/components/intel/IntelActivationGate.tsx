import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

interface Props {
  followCount: number;
}

const DOT = ({ cx, cy }: { cx: number; cy: number }) => (
  <circle cx={cx} cy={cy} r={3} fill="hsl(190, 100%, 50%)" />
);

const LINE = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
);

export const IntelActivationGate = ({ followCount }: Props) => {
  const needed = Math.max(0, 5 - followCount);
  const pct = Math.min(100, (followCount / 5) * 100);

  return (
    <div className="glass-panel p-8 text-center space-y-5">
      {/* Constellation SVG */}
      <svg viewBox="0 0 160 80" className="w-40 h-20 mx-auto" fill="none">
        <LINE x1={20} y1={15} x2={55} y2={40} />
        <LINE x1={55} y1={40} x2={90} y2={15} />
        <LINE x1={55} y1={40} x2={70} y2={65} />
        <LINE x1={70} y1={65} x2={105} y2={55} />
        <LINE x1={105} y1={55} x2={140} y2={65} />
        <LINE x1={105} y1={55} x2={120} y2={25} />
        <DOT cx={20} cy={15} />
        <DOT cx={55} cy={40} />
        <DOT cx={90} cy={15} />
        <DOT cx={70} cy={65} />
        <DOT cx={105} cy={55} />
        <DOT cx={140} cy={65} />
        <DOT cx={120} cy={25} />
        <DOT cx={55} cy={40} />
      </svg>

      <div>
        <h2 className="text-lg font-bold text-foreground">✦ Intel Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Intel activates after following 5 accounts, startups, or topics.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        You follow <span className="text-primary font-semibold">{followCount}</span>.{" "}
        {needed > 0 ? (
          <span>{needed} more to unlock.</span>
        ) : (
          <span>Intel is ready!</span>
        )}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "hsl(190, 100%, 50%)" }}
        />
      </div>

      <Link
        to="/discover"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Compass className="h-4 w-4" /> Discover More →
      </Link>
    </div>
  );
};
