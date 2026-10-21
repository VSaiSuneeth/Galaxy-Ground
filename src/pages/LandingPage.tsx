import { ArrowRight, BookOpen, Building2, CalendarDays, Check, CircleHelp, Clock3, Menu, Radio, Rocket, Telescope } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";

const launchRows = [
  ["21", "Oct", "Gaganyaan G1", "ISRO · LVM3", "Go", "T−02:14:09"],
  ["22", "Oct", "Ariane 6 Commercial Rideshare", "Arianespace · Ariane 6", "NET", "T−1d 5h"],
  ["24", "Oct", "Starlink Group", "SpaceX · Falcon 9", "Go", "T−3d 11h"],
  ["18", "Nov", "New Glenn Customer Mission", "Blue Origin · New Glenn", "TBD", "T−28d"],
] as const;

const faqs = [
  ["What does it cost to join?", "Creating an account and using the feed, launch calendar and Orbits is free. Some Learn paths are marked premium."],
  ["Where does the launch data come from?", "Each launch includes its sources so you can check the claim and follow updates as they develop."],
  ["Can I use it on my phone?", "Yes. Galaxy Ground is designed phone-first, with a bottom tab bar and a quick Compose button."],
  ["Can my startup be listed?", "Yes. Startups can create a profile, share updates and list open roles in Launchpad."],
] as const;

const LandingPage = () => (
  <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b border-border bg-background/95">
      <nav className="mx-auto flex h-16 max-w-[1360px] items-center gap-6 px-5 lg:px-10" aria-label="Landing navigation">
        <a href="#top" className="flex shrink-0 items-center gap-2"><LogoMark size={30} /><Wordmark /></a>
        <div className="hidden items-center gap-1 md:flex">
          {[['Launches', '#launches'], ['Feed', '#feed'], ['Orbits', '#orbits'], ['India in space', '#india'], ['FAQ', '#faq']].map(([label, href]) => <a key={href} href={href} className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">{label}</a>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex">Sign in</Link>
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-brand/90">Create account <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </nav>
    </header>

    <main id="top">
      <section className="relative overflow-hidden border-b border-border pb-16 pt-14 lg:pt-20">
        <div className="mx-auto grid max-w-[1360px] items-center gap-10 px-5 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-10">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 telemetry"><span className="h-2 w-2 rounded-full bg-brand" /> Next launch <strong className="font-mono text-foreground">T−02:14:09</strong></p>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-8xl">Your ground station for <span className="text-brand">everything</span> space.</h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">Every launch on one live board. The people and startups behind them. A feed that actually talks space.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-primary-foreground hover:bg-brand/90">Create your account <ArrowRight className="h-4 w-4" /></Link><a href="#launches" className="rounded-full border border-border px-6 py-3 font-semibold hover:bg-muted">See the launch calendar</a></div>
            <p className="mt-4 text-sm text-muted-foreground">Free to join. Launch times and posts shown here are sample content.</p>
          </div>
          <div className="space-y-4">
            <article className="border border-border bg-card p-6"><div className="flex items-center justify-between"><span className="telemetry">Next launch</span><span className="rounded-md bg-signal/15 px-2 py-1 font-mono text-[11px] text-signal">GO</span></div><p className="mt-5 font-mono text-4xl font-semibold sm:text-5xl">T−02:14:09</p><h2 className="mt-5 font-display text-2xl font-semibold">Gaganyaan G1</h2><p className="text-muted-foreground">ISRO · LVM3 · Sriharikota</p></article>
            <article className="border border-border bg-card"><div className="flex gap-3 border-b border-border p-4"><span className="grid h-11 w-11 place-items-center rounded-[28%] bg-info/50 font-mono text-sm text-foreground">AA</span><div><p className="font-semibold">Aadyah Aerospace <span className="telemetry text-brand">Startup</span></p><p className="mt-1 text-sm">Static fire complete on the second stage. Next up: integration.</p></div></div><div className="flex gap-5 p-4 font-mono text-xs text-muted-foreground"><span className="text-brand">Boost 246</span><span>Comment</span><span>Share</span></div></article>
          </div>
        </div>
      </section>

      <section id="launches" className="mx-auto grid max-w-[1360px] gap-10 px-5 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
        <div><p className="telemetry">Launch calendar</p><h2 className="mt-3 font-display text-5xl font-semibold leading-tight">Never miss a countdown.</h2><p className="mt-4 text-lg text-muted-foreground">One departure board for every launch worth watching, in your own timezone.</p><ul className="mt-7 space-y-3 text-muted-foreground">{['Status at a glance. Go, NET, TBD or Hold.', 'Live countdowns that turn ember in the final hour.', 'Sources on every launch so you can check the claim.'].map((line) => <li key={line} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-brand" />{line}</li>)}</ul></div>
        <div className="border border-border bg-card">{launchRows.map(([day, month, name, operator, status, countdown]) => <div key={name} className="grid grid-cols-[52px_1fr] gap-4 border-b border-border p-5 last:border-0 sm:grid-cols-[72px_1fr_auto] sm:items-center"><div><p className="font-display text-3xl">{day}</p><p className="telemetry">{month}</p></div><div><h3 className="font-semibold">{name}</h3><p className="text-sm text-muted-foreground">{operator}</p></div><div className="col-start-2 flex items-center gap-3 sm:col-start-auto sm:flex-col sm:items-end"><span className="rounded-md bg-muted px-2 py-1 font-mono text-[11px]">{status}</span><span className="font-mono text-sm text-brand">{countdown}</span></div></div>)}</div>
      </section>

      <section id="feed" className="border-y border-border bg-card"><div className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-10"><div className="mx-auto w-full max-w-sm border border-border bg-background p-4"><div className="flex items-center justify-between border-b border-border pb-3"><LogoMark size={22} /><span className="telemetry">For you</span></div><div className="border-b border-border py-4"><p className="font-semibold">Pixxel</p><p className="mt-1 text-sm">New hyperspectral imagery from this week’s pass is live.</p><p className="mt-3 font-mono text-xs text-brand">Boost 418</p></div><div className="py-4"><p className="font-semibold">Manideep</p><p className="mt-1 text-sm">Anyone doing exoplanet research? <span className="text-brand">#astrobiology</span></p></div></div><div><p className="telemetry">The feed</p><h2 className="mt-3 font-display text-5xl font-semibold leading-tight">A feed that talks space.</h2><p className="mt-4 text-lg text-muted-foreground">Follow startups, creators and Orbits. Boost what matters. Keep the noise out of the way of the next launch.</p></div></div></section>

      <section id="orbits" className="mx-auto max-w-[1360px] px-5 py-20 lg:px-10"><p className="telemetry">Everything in one place</p><h2 className="mt-3 font-display text-5xl font-semibold">Five tools. One ground station.</h2><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Feature icon={Telescope} title="Orbits" text="Communities for astrophotography, rocket engineering, space policy and more." /><Feature icon={Building2} title="Launchpad" text="Follow startups, read their updates, find open roles." /><Feature icon={Radio} title="Live" text="Watch launches and events as they happen." /><Feature icon={BookOpen} title="Learn" text="Short, curated paths with modules and videos." /><Feature icon={CalendarDays} title="Hangar" text="Keep the posts worth rereading." /></div></section>

      <section id="india" className="border-y border-border bg-card"><div className="mx-auto grid max-w-[1360px] gap-8 px-5 py-20 lg:grid-cols-2 lg:px-10"><div><p className="telemetry">India in space</p><h2 className="mt-3 font-display text-5xl font-semibold leading-tight">Built with India’s space story in mind.</h2><p className="mt-4 text-lg text-muted-foreground">From ISRO missions to the startups building the next decade in orbit, launch times show in your timezone and in IST.</p></div><div className="grid grid-cols-2 self-center border border-border"><TimeCard label="Gaganyaan G1 · your time" value="--:--" /><TimeCard label="Same launch · IST" value="--:--" /></div></div></section>

      <section className="mx-auto max-w-[1360px] px-5 py-20 lg:px-10"><p className="telemetry">How it works</p><h2 className="mt-3 font-display text-5xl font-semibold">Up and running in a minute.</h2><div className="mt-10 grid gap-8 md:grid-cols-3">{[['01', 'Pick your orbits', 'Choose the topics you care about. Change them any time.'], ['02', 'Follow the launches', 'Get the board, the countdowns and the people behind them.'], ['03', 'Join the conversation', 'Post, boost, message. Meet people who look up too.']].map(([number, title, copy]) => <div key={number} className="border-t-2 border-brand pt-5"><p className="font-display text-5xl text-muted-foreground">{number}</p><h3 className="mt-4 text-xl font-semibold">{title}</h3><p className="mt-2 text-muted-foreground">{copy}</p></div>)}</div></section>

      <section id="faq" className="border-t border-border"><div className="mx-auto grid max-w-[1360px] gap-10 px-5 py-20 lg:grid-cols-[.7fr_1.3fr] lg:px-10"><div><p className="telemetry">FAQ</p><h2 className="mt-3 font-display text-5xl font-semibold">Good questions.</h2></div><div>{faqs.map(([question, answer], index) => <details key={question} open={index === 0} className="border-t border-border py-5 last:border-b"><summary className="cursor-pointer text-lg font-semibold">{question}</summary><p className="mt-3 max-w-2xl text-muted-foreground">{answer}</p></details>)}</div></div></section>
      <section className="border-t border-border px-5 py-24 text-center"><p className="telemetry">Look up. Stay in the loop.</p><h2 className="mx-auto mt-4 max-w-4xl font-display text-5xl font-semibold leading-tight">The next launch is <span className="font-mono text-brand">T−02:14:09</span> away.</h2><div className="mt-8 flex justify-center gap-3"><Link to="/auth" className="rounded-full bg-brand px-6 py-3 font-semibold text-primary-foreground">Create your account</Link><Link to="/auth" className="rounded-full border border-border px-6 py-3 font-semibold hover:bg-muted">Sign in</Link></div></section>
    </main>
    <footer className="border-t border-border"><div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-5 px-5 py-8 text-sm text-muted-foreground lg:px-10"><a href="#top" className="flex items-center gap-2 text-foreground"><LogoMark size={26} /><Wordmark /></a><div className="flex gap-5"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/docs/api">API</Link></div><span className="telemetry">© Galaxy Ground</span></div></footer>
  </div>
);

const Feature = ({ icon: Icon, title, text }: { icon: typeof Rocket; title: string; text: string }) => <article className="min-h-52 border border-border bg-card p-6"><Icon className="h-6 w-6 text-brand" /><p className="mt-8 telemetry">{title}</p><h3 className="mt-2 font-display text-2xl font-semibold">{title}</h3><p className="mt-3 text-muted-foreground">{text}</p></article>;
const TimeCard = ({ label, value }: { label: string; value: string }) => <div className="p-6 first:border-r first:border-border"><p className="telemetry">{label}</p><p className="mt-3 font-mono text-2xl font-semibold">{value}</p></div>;

export default LandingPage;
