import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageLoading } from "@/components/PageState";
import { QUERY_DEFAULTS } from "@/lib/query-config";
import { ThemeProvider } from "next-themes";

// Eager-loaded pages (critical path)
import HomeFeed from "@/pages/HomeFeed";
import AuthPage from "@/pages/AuthPage";
import LandingPage from "@/pages/LandingPage";

// Lazy-loaded pages (split into separate chunks)
const ExplorePage = lazy(() => import("@/pages/ExplorePage"));
const ExploreDetailPage = lazy(() => import("@/pages/ExploreDetailPage"));
const CommunitiesPage = lazy(() => import("@/pages/CommunitiesPage"));
const CommunityDetailPage = lazy(() => import("@/pages/CommunityDetailPage"));
const MissionsPage = lazy(() => import("@/pages/MissionsPage"));
const LaunchDetailPage = lazy(() => import("@/pages/LaunchDetailPage"));
const StartupDetailPage = lazy(() => import("@/pages/StartupDetailPage"));
const StartupManagePage = lazy(() => import("@/pages/StartupManagePage"));
const StartupsPage = lazy(() => import("@/pages/StartupsPage"));
const HashtagPage = lazy(() => import("@/pages/HashtagPage"));
const LearningPage = lazy(() => import("@/pages/LearningPage"));
const LearningDetailPage = lazy(() => import("@/pages/LearningDetailPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const UserProfilePage = lazy(() => import("@/pages/UserProfilePage"));
const ThemedAccountPage = lazy(() => import("@/pages/ThemedAccountPage"));
const PostDetailPage = lazy(() => import("@/pages/PostDetailPage"));
const BookmarksPage = lazy(() => import("@/pages/BookmarksPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AdminReadinessPage = lazy(() => import("@/pages/AdminReadinessPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const MessagingSettingsPage = lazy(() => import("@/pages/MessagingSettingsPage"));
const LiveHubPage = lazy(() => import("@/pages/LiveHubPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const ApiDocsPage = lazy(() => import("@/pages/ApiDocsPage"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: QUERY_DEFAULTS,
  },
});

const PageLoader = () => <PageLoading label="Loading page…" />;

const LandingGate = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <AppLayout><HomeFeed /></AppLayout> : <LandingPage />;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="gg-theme">
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route
              path="/auth"
              element={
                <ErrorBoundary label="Auth">
                  <AuthPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/auth/reset"
              element={
                <ErrorBoundary label="AuthReset">
                  <Suspense fallback={<PageLoader />}>
                    <ResetPasswordPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/"
              element={
                <ErrorBoundary label="Landing">
                  <LandingGate />
                </ErrorBoundary>
              }
            />
            <Route element={<AppLayout />}>
              <Route
                path="/explore"
                element={
                  <ErrorBoundary label="Explore">
                    <Suspense fallback={<PageLoader />}>
                      <ExplorePage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/explore/:slug"
                element={
                  <ErrorBoundary label="ExploreDetail">
                    <Suspense fallback={<PageLoader />}>
                      <ExploreDetailPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/discover"
                element={
                  <ErrorBoundary label="Explore">
                    <Suspense fallback={<PageLoader />}>
                      <ExplorePage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/startups"
                element={
                  <ErrorBoundary label="Startups">
                    <Suspense fallback={<PageLoader />}>
                      <StartupsPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/communities"
                element={
                  <ErrorBoundary label="Communities">
                    <Suspense fallback={<PageLoader />}>
                      <CommunitiesPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/community/:slug"
                element={
                  <ErrorBoundary label="CommunityDetail">
                    <Suspense fallback={<PageLoader />}>
                      <CommunityDetailPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/missions"
                element={
                  <ErrorBoundary label="Missions">
                    <Suspense fallback={<PageLoader />}>
                      <MissionsPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/launch/:slug"
                element={
                  <ErrorBoundary label="LaunchDetail">
                    <Suspense fallback={<PageLoader />}>
                      <LaunchDetailPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/startup/:slug"
                element={
                  <ErrorBoundary label="StartupDetail">
                    <Suspense fallback={<PageLoader />}>
                      <StartupDetailPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/startup/:slug/manage"
                element={
                  <ErrorBoundary label="StartupManage">
                    <Suspense fallback={<PageLoader />}>
                      <StartupManagePage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/hashtag/:tag"
                element={
                  <ErrorBoundary label="Hashtag">
                    <Suspense fallback={<PageLoader />}>
                      <HashtagPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/learning"
                element={
                  <ErrorBoundary label="Learning">
                    <Suspense fallback={<PageLoader />}>
                      <LearningPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/learning/:slug"
                element={
                  <ErrorBoundary label="LearningDetail">
                    <Suspense fallback={<PageLoader />}>
                      <LearningDetailPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/live"
                element={
                  <ErrorBoundary label="LiveHub">
                    <Suspense fallback={<PageLoader />}>
                      <LiveHubPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/live/archive"
                element={
                  <ErrorBoundary label="LiveHub">
                    <Suspense fallback={<PageLoader />}>
                      <LiveHubPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/live/archive/:eventId"
                element={
                  <ErrorBoundary label="LiveHub">
                    <Suspense fallback={<PageLoader />}>
                      <LiveHubPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/profile"
                element={
                  <ErrorBoundary label="Profile">
                    <Suspense fallback={<PageLoader />}>
                      <ProfilePage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/u/:userId"
                element={
                  <ErrorBoundary label="UserProfile">
                    <Suspense fallback={<PageLoader />}>
                      <UserProfilePage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/creator/:handle"
                element={
                  <ErrorBoundary label="ThemedAccount">
                    <Suspense fallback={<PageLoader />}>
                      <ThemedAccountPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/post/:id"
                element={
                  <ErrorBoundary label="PostDetail">
                    <Suspense fallback={<PageLoader />}>
                      <PostDetailPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/bookmarks"
                element={
                  <ErrorBoundary label="Bookmarks">
                    <Suspense fallback={<PageLoader />}>
                      <BookmarksPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/messages"
                element={
                  <ErrorBoundary label="Messages">
                    <Suspense fallback={<PageLoader />}>
                      <MessagesPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/messages/:threadId"
                element={
                  <ErrorBoundary label="MessagesThread">
                    <Suspense fallback={<PageLoader />}>
                      <MessagesPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/settings/messaging"
                element={
                  <ErrorBoundary label="MessagingSettings">
                    <Suspense fallback={<PageLoader />}>
                      <MessagingSettingsPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/admin"
                element={
                  <ErrorBoundary label="AdminDashboard">
                    <Suspense fallback={<PageLoader />}>
                      <AdminDashboardPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/admin/readiness"
                element={
                  <ErrorBoundary label="AdminReadiness">
                    <Suspense fallback={<PageLoader />}>
                      <AdminReadinessPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/privacy"
                element={
                  <ErrorBoundary label="Privacy">
                    <Suspense fallback={<PageLoader />}>
                      <PrivacyPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/terms"
                element={
                  <ErrorBoundary label="Terms">
                    <Suspense fallback={<PageLoader />}>
                      <TermsPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/docs/api"
                element={
                  <ErrorBoundary label="ApiDocs">
                    <Suspense fallback={<PageLoader />}>
                      <ApiDocsPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/settings"
                element={
                  <ErrorBoundary label="Settings">
                    <Suspense fallback={<PageLoader />}>
                      <MessagingSettingsPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
            </Route>
            <Route path="*" element={<ErrorBoundary label="NotFound"><Suspense fallback={<PageLoader />}><NotFound /></Suspense></ErrorBoundary>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
