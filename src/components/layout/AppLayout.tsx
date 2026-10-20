import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import StarField from "@/components/StarField";
import SupabaseHealthBanner from "@/components/SupabaseHealthBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import OnboardingModal from "@/components/OnboardingModal";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen cosmic-gradient relative">
      <StarField />
      <ErrorBoundary label="AppLayout">
        <TopNav onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <div className="flex max-w-[1600px] mx-auto relative z-10">
          <LeftSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 min-w-0 py-4 px-4">
            <SupabaseHealthBanner />
            <Outlet />
            <OnboardingModal />
          </main>
          <RightSidebar />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default AppLayout;
