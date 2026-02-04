// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

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

// Global Components
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import PageLoader from "./components/PageLoader";
import Footer from "./components/Footer";

// Home Sections
import Hero from "./components/Hero";
import DemoSection from "./components/Demo";
import ProblemSection from "./components/ProblemSection";

// Feature Pages
import HowItWorks from "./pages/HowItWorks";
import Updates from "./pages/Updates";
import SmartNotes from "./pages/SmartNotes";
import AISummary from "./pages/AISummary";

// PUBLIC Integrations Landing Page (for Navbar/marketing site)
import IntegrationsLanding from "./pages/IntegrationsLanding";

// Support Pages
import Support from "./pages/Support";
import FAQ from "./pages/FAQ";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";

// Support sub-pages (Dashboard)
import HelpCenter from "./pages/HelpCenter";
import ContactSupport from "./pages/ContactSupport";

// Integration Docs (Dashboard)
import IntegrationDocs from "./pages/IntegrationDocs";

// Auth Pages
import SignupPage from "./pages/Signup";
import LoginPage from "./pages/Login";
import SearchPage from "./pages/Search";
import TermsPage from "./pages/Terms";
import StatusPage from "./pages/Status";

// Dashboard Layout & Pages
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Summaries from "./pages/Summaries";
import Documents from "./pages/Documents";
import Activity from "./pages/Activity";
import AiLab from "./pages/AiLab";
import CustomTraining from "./pages/CustomTraining";
import CloudSync from "./pages/CloudSync";
import VoiceNotes from "./pages/VoiceNotes";
import TeamCollaboration from "./pages/TeamCollaboration";
import Settings from "./pages/Settings";
import DocumentViewer from "./pages/DocumentViewer";
import RewriteDocument from "./pages/RewriteDocument";

// DASHBOARD Integrations Page (for logged-in users)
import DashboardIntegrations from "./pages/dashboard/Integrations";
import IntegrationConnect from "./pages/dashboard/IntegrationConnect";

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
// ----------------------------------------------------------------
function RouteActivityLogger() {
  const { pathname } = useLocation();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!alive) return;

        const userId = session?.user?.id;
        if (!userId) return;

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
  }, [pathname]);

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
    initial: { opacity: 0, y: 12, filter: "blur(6px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0)",
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -12,
      filter: "blur(6px)",
      transition: { duration: 0.25, ease: "easeIn" },
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
          <Routes>
            <Route path="/" element={<HomeLanding />} />

            <Route path="/smart-notes" element={<SmartNotes />} />
            <Route path="/ai-summary" element={<AISummary />} />

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
// ROOT APP - Wrapped with all Providers
// ----------------------------------------------------------------
export default function App() {
  const routerBasename = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

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

  const [notes, setNotes] = useState([]);

  return (
    <ThemeProvider>
      <IntegrationsProvider>
        <SubscriptionProvider>
          <WorkspaceProvider>
            <Router basename={routerBasename}>
              <ScrollToTop />
              <RouteTitle />

              {/* ✅ matches what I provided: logs page_view events */}
              <RouteActivityLogger />

              <Routes>
                {/* PUBLIC SITE */}
                <Route path="/*" element={<PublicSiteWrapper />} />

                {/* DASHBOARD PAGES */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />

                  {/* NOTES */}
                  <Route
                    path="notes"
                    element={<Notes notes={notes} setNotes={setNotes} />}
                  />
                  <Route
                    path="notes/:noteId"
                    element={<Notes notes={notes} setNotes={setNotes} />}
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
            </Router>
          </WorkspaceProvider>
        </SubscriptionProvider>
      </IntegrationsProvider>
    </ThemeProvider>
  );
}






