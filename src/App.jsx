// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, lazy, Suspense } from "react";

// Theme Provider
import { ThemeProvider } from "./context/ThemeContext";

// Integrations Provider
import { IntegrationsProvider } from "./hooks/useIntegrations";

// Subscription Provider (no SubscriptionBridge needed)
import { SubscriptionProvider } from "./hooks/useSubscription";

// Workspace Settings Provider
import { WorkspaceProvider } from "./hooks/useWorkspaceSettings";

// ✅ Activity logger + session
import { logActivityEvent } from "./lib/activityEvents";
import { supabase } from "./lib/supabaseClient";

// ✅ Notes CRUD hook — backed by a Context provider so the whole app
// shares ONE auth listener and ONE notes state. Previously App.jsx
// and Sidebar.jsx both called useNotes() independently which caused
// divergent state and duplicated network traffic on every auth event.
import { NotesProvider, useNotes } from "./hooks/useNotes";

// ✅ Single shared auth state — replaces the 18 scattered getSession()
// call sites that all could independently trigger refresh_token and
// cause 429s under load.
import { AuthProvider, useAuth } from "./hooks/useAuth";

// Global Components — eager: needed on every public page render
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import PageLoader from "./components/PageLoader";
import Footer from "./components/Footer";

// Home Sections — eager: this IS the landing page, first paint
import Hero from "./components/Hero";
import DemoSection from "./components/Demo";
import ProblemSection from "./components/ProblemSection";

// Auth pages — eager: high-traffic entry points where loading flicker is bad
import SignupPage from "./pages/Signup";
import LoginPage from "./pages/Login";

import NoteView from "./pages/NoteView";

// Everything below is lazy-loaded so the initial JS bundle doesn't include code
// for pages a given visitor probably won't visit. React.lazy returns a wrapped
// component that triggers a separate HTTP request the first time it's rendered.
// Suspense (further down) shows PageLoader while each chunk downloads.

// Secondary public pages
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Updates = lazy(() => import("./pages/Updates"));
const HelpCenterMarketing = lazy(() => import("./pages/HelpCenter"));
const SmartNotes = lazy(() => import("./pages/SmartNotes"));
const AISummary = lazy(() => import("./pages/AISummary"));
const VoiceNotesMarketing = lazy(() => import("./pages/VoiceNotesMarketing"));
const IntegrationsLanding = lazy(() => import("./pages/IntegrationsLanding"));
const Support = lazy(() => import("./pages/Support"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const ContactSupport = lazy(() => import("./pages/ContactSupport"));
const IntegrationDocs = lazy(() => import("./pages/IntegrationDocs"));
const SearchPage = lazy(() => import("./pages/Search"));
const TermsPage = lazy(() => import("./pages/Terms"));
const StatusPage = lazy(() => import("./pages/Status"));

// Dashboard — entire tree is gated behind auth so most public visitors
// will never download any of this.
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Notes = lazy(() => import("./pages/Notes"));
const Summaries = lazy(() => import("./pages/Summaries"));
const Documents = lazy(() => import("./pages/Documents"));
const Activity = lazy(() => import("./pages/Activity"));
const AiLab = lazy(() => import("./pages/AiLab"));
const CustomTraining = lazy(() => import("./pages/CustomTraining"));
const CloudSync = lazy(() => import("./pages/CloudSync"));
const VoiceNotes = lazy(() => import("./pages/VoiceNotes"));
const TeamCollaboration = lazy(() => import("./pages/TeamCollaboration"));
const Settings = lazy(() => import("./pages/Settings"));
const DocumentViewer = lazy(() => import("./pages/DocumentViewer"));
const RewriteDocument = lazy(() => import("./pages/RewriteDocument"));
const DashboardIntegrations = lazy(() => import("./pages/dashboard/Integrations"));
const IntegrationConnect = lazy(() => import("./pages/dashboard/IntegrationConnect"));

// ----------------------------------------------------------------
// ROUTE TITLE (updates browser tab title)
// ----------------------------------------------------------------
function RouteTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/dashboard/integrations/connect/")) {
      document.title = "Connect Integration | NoteStream";
      return;
    }
    if (pathname.startsWith("/dashboard/integrations")) {
      document.title = "Dashboard Integrations | NoteStream";
      return;
    }
    if (pathname.startsWith("/dashboard")) {
      document.title = "Dashboard | NoteStream";
      return;
    }

    const map = {
      "/": "NoteStream",
      "/smart-notes": "Smart Notes | NoteStream",
      "/ai-summary": "AI Summary | NoteStream",
      "/integrations-landing": "Integrations | NoteStream",
      "/how-it-works": "How It Works | NoteStream",
      "/updates": "Updates | NoteStream",
      "/support": "Support | NoteStream",
      "/faq": "FAQ | NoteStream",
      "/reset-password": "Reset Password | NoteStream",
      "/update-password": "Update Password | NoteStream",
      "/pricing": "Billing & Plans | NoteStream",
      "/privacy": "Privacy Policy | NoteStream",
      "/signup": "Sign Up | NoteStream",
      "/login": "Login | NoteStream",
      "/search": "Search | NoteStream",
      "/terms": "Terms | NoteStream",
      "/status": "Status | NoteStream",
    };

    document.title = map[pathname] || "NoteStream";
  }, [pathname]);

  return null;
}

// ----------------------------------------------------------------
// ✅ Route-change activity logging (page views)
// Reads userId from the shared AuthProvider — previously this fired
// a fresh getSession() on every navigation, which contributed to
// the refresh_token storm when the cached JWT was expired.
// ----------------------------------------------------------------
function RouteActivityLogger() {
  const { pathname } = useLocation();
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;

    (async () => {
      try {
        if (!alive) return;
        await logActivityEvent({
          userId,
          eventType: "page_view",
          entityId: null,
          metadata: { path: pathname },
          title: `Visited ${pathname}`,
        });
      } catch {
        // never block navigation
      }
    })();

    return () => {
      alive = false;
    };
  }, [pathname, userId]);

  return null;
}

// ----------------------------------------------------------------
// PUBLIC PAGE ANIMATION WRAPPER
// ----------------------------------------------------------------
function PublicRoutesFadeWrapper() {
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    setShowLoader(true);
    const t = setTimeout(() => setShowLoader(false), 450);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.22, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.14, ease: "easeIn" },
    },
  };

  return (
    <>
      <PageLoader isVisible={showLoader} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen"
        >
          <Suspense fallback={<PageLoader isVisible />}>
            <Routes>
              <Route path="/" element={<HomeLanding />} />

              <Route path="/smart-notes" element={<SmartNotes />} />
              <Route path="/ai-summary" element={<AISummary />} />
              <Route path="/voice-notes" element={<VoiceNotesMarketing />} />

              <Route
                path="/integrations-landing"
                element={<IntegrationsLanding />}
              />
              <Route
                path="/integrations"
                element={<Navigate to="/integrations-landing" replace />}
              />

              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/updates" element={<Updates />} />

              <Route path="/support" element={<Support />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/help-center" element={<HelpCenterMarketing />} />

              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />

              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<Privacy />} />

              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/status" element={<StatusPage />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// ----------------------------------------------------------------
// PUBLIC LANDING CONTENT
// ----------------------------------------------------------------
function HomeLanding() {
  return (
    <>
      <Hero />
      <DemoSection />
      <ProblemSection />
    </>
  );
}

// ----------------------------------------------------------------
// PUBLIC SITE WRAPPER WITH CONDITIONAL NAV/FOOTER
// ----------------------------------------------------------------
function PublicSiteWrapper() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && (
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <Navbar />
        </div>
      )}

      <div className={!isDashboard ? "pt-[0px]" : ""}>
        <PublicRoutesFadeWrapper />
      </div>

      {!isDashboard && <Footer />}
    </>
  );
}

// ----------------------------------------------------------------
// ROUTE TREE — needs notes from context, so it lives inside
// NotesProvider. Extracted from App() so the useNotes() call can
// resolve against the Provider we mount one level up.
// ----------------------------------------------------------------
function AppRoutes() {
  const [docs, setDocs] = useState([
    {
      id: "1",
      name: "projectRoadmap.pdf",
      type: "PDF",
      size: "1.2 MB",
      updated: "2 days ago",
      fileUrl: `${import.meta.env.BASE_URL}docs/projectRoadmap.pdf`,
      summary: null,
    },
  ]);

  const {
    notes,
    setNotes,
    createNote,
    updateNote,
    deleteNote,
    refetch: refetchNotes,
  } = useNotes();

  return (
    <>
      <ScrollToTop />
      <RouteTitle />
      <RouteActivityLogger />

      <Suspense fallback={<PageLoader isVisible />}>
        <Routes>
          {/* PUBLIC SITE */}
          <Route path="/*" element={<PublicSiteWrapper />} />

          {/* DASHBOARD PAGES */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />

            {/* NOTES */}
            <Route
              path="notes"
              element={
                <Notes
                  notes={notes}
                  setNotes={setNotes}
                  createNote={createNote}
                  updateNote={updateNote}
                  deleteNote={deleteNote}
                  refetchNotes={refetchNotes}
                />
              }
            />
            <Route
              path="notes/:id"
              element={
                <NoteView
                  notes={notes}
                  updateNote={updateNote}
                  deleteNote={deleteNote}
                />
              }
            />

            {/* DOCUMENTS */}
            <Route
              path="documents"
              element={<Documents docs={docs} setDocs={setDocs} />}
            />
            <Route
              path="documents/:id"
              element={<DocumentViewer docs={docs} />}
            />
            <Route
              path="documents/view/:id"
              element={<DocumentViewer docs={docs} />}
            />
            <Route
              path="documents/rewrite/:id"
              element={<RewriteDocument docs={docs} setDocs={setDocs} />}
            />

            {/* INTEGRATIONS */}
            <Route
              path="integrations"
              element={<DashboardIntegrations />}
            />
            <Route
              path="integrations/connect/:integrationId"
              element={<IntegrationConnect />}
            />

            {/* OTHER SECTIONS */}
            <Route path="summaries" element={<Summaries />} />
            <Route path="activity" element={<Activity />} />

            {/* SUPPORT */}
            <Route path="help-center" element={<HelpCenter />} />
            <Route path="contact-support" element={<ContactSupport />} />

            {/* Integration Docs */}
            <Route
              path="integration-docs"
              element={<IntegrationDocs />}
            />

            {/* AI LAB */}
            <Route path="ai-lab" element={<AiLab />} />
            <Route path="ai-lab/training" element={<CustomTraining />} />
            <Route path="ai-lab/cloud-sync" element={<CloudSync />} />
            <Route path="ai-lab/voice-notes" element={<VoiceNotes />} />
            <Route
              path="ai-lab/team-collaboration"
              element={<TeamCollaboration />}
            />

            {/* SETTINGS */}
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

// ----------------------------------------------------------------
// ROOT APP - Wrapped with all Providers
// ----------------------------------------------------------------
export default function App() {
  const routerBasename = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

  return (
    <ThemeProvider>
      <AuthProvider>
        <IntegrationsProvider>
          <SubscriptionProvider>
            <WorkspaceProvider>
              <NotesProvider>
                <Router basename={routerBasename}>
                  <AppRoutes />
                </Router>
              </NotesProvider>
            </WorkspaceProvider>
          </SubscriptionProvider>
        </IntegrationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}






