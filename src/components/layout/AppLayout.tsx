import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import BottomTabs from "./BottomTabs";
import SupabaseHealthBanner from "@/components/SupabaseHealthBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import OnboardingModal from "@/components/OnboardingModal";

const AppLayout = ({ children }: { children?: ReactNode }) => {
  const { pathname } = useLocation();
  const isMessages = pathname.startsWith("/messages");
  const isFeed = ["/", "/profile", "/bookmarks"].includes(pathname)
    || ["/post/", "/hashtag/", "/u/", "/creator/", "/community/", "/startup/", "/explore/", "/launch/", "/learning/"].some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="min-h-dvh bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] rounded-md bg-primary px-3 py-2 text-primary-foreground">Skip to content</a>
      <ErrorBoundary label="AppLayout">
        <div className="grid min-h-dvh w-full grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <LeftSidebar />
          <div className="flex min-w-0 flex-col">
            <TopNav />
            <SupabaseHealthBanner />
            <div className={`flex min-w-0 flex-1 ${isMessages ? "" : "justify-center"}`}>
              <main id="main" className={isMessages ? "min-w-0 flex-1" : isFeed ? "min-w-0 w-full max-w-[760px]" : "min-w-0 w-full max-w-[1680px] px-3 py-4 sm:px-5 lg:px-8 xl:px-10"}>
                {children ?? <Outlet />}
              </main>
              {isFeed && <RightSidebar />}
            </div>
          </div>
        </div>
        <BottomTabs />
        <OnboardingModal />
      </ErrorBoundary>
    </div>
  );
};

export default AppLayout;
