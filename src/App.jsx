import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

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
import Integrations from "./pages/Integrations";

// Support Pages
import Support from "./pages/Support";
import FAQ from "./pages/FAQ";

// Auth Pages
import SignupPage from "./pages/Signup";
import LoginPage from "./pages/Login";
import SearchPage from "./pages/Search";
import TermsPage from "./pages/Terms";

// Dashboard Layout & Pages
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Summaries from "./pages/Summaries";
import Documents from "./pages/Documents";
import Activity from "./pages/Activity";
import AiLab from "./pages/AiLab";
import Settings from "./pages/Settings";
import DocumentViewer from "./pages/DocumentViewer";
import RewriteDocument from "./pages/RewriteDocument";



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
      transition: { duration: 0.35, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      y: -12,
      filter: "blur(6px)",
      transition: { duration: 0.25, ease: "easeIn" }
    }
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
            {/* Landing */}
            <Route path="/" element={<HomeLanding />} />

            {/* Features */}
            <Route path="/smart-notes" element={<SmartNotes />} />
            <Route path="/ai-summary" element={<AISummary />} />
            <Route path="/integrations" element={<Integrations />} />

            {/* Main */}
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/updates" element={<Updates />} />

            {/* Support */}
            <Route path="/support" element={<Support />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Auth */}
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/terms" element={<TermsPage />} />
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

      <div className={!isDashboard ? "pt-[80px]" : ""}>
        <PublicRoutesFadeWrapper />
      </div>

      {!isDashboard && <Footer />}
    </>
  );
}


// ----------------------------------------------------------------
// ROOT APP
// ----------------------------------------------------------------
export default function App() {
  const [docs, setDocs] = useState([
    {
      id: "1",
      name: "projectRoadmap.pdf",
      type: "PDF",
      size: "1.2 MB",
      updated: "2 days ago",
      fileUrl: "/docs/projectRoadmap.pdf",

      // NEW Smart Summary Intelligence
      summary: null,
    }
  ]);


  const [notes, setNotes] = useState([]);
  
  return (
    <Router>
      <ScrollToTop />

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
            path="documents/view/:id"
            element={<DocumentViewer docs={docs} />}
          />
          
          <Route
            path="documents/rewrite/:id"
            element={<RewriteDocument docs={docs} setDocs={setDocs} />}
          />

          {/* OTHER SECTIONS */}
          <Route path="summaries" element={<Summaries />} />
          <Route path="activity" element={<Activity />} />
          <Route path="ai-lab" element={<AiLab />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}



