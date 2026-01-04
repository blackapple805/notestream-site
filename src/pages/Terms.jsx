// src/pages/Terms.jsx
export default function TermsPage() {
  return (
    <section 
      className="min-h-screen px-6 py-24 text-theme-secondary max-w-4xl mx-auto leading-relaxed"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <h1 className="text-4xl font-bold text-theme-primary mb-6">
        Terms & Conditions
      </h1>

      <p className="mb-6">
        Welcome to <span className="text-indigo-500 font-semibold">NoteStream</span>.
        By accessing or using our website, dashboard, or associated services,
        you agree to the following terms. If you do not agree, please discontinue use.
      </p>

      <h2 className="text-2xl font-semibold text-theme-primary mt-8 mb-3">1. Use of Service</h2>
      <p className="mb-4">
        You agree to use NoteStream only for lawful and permitted purposes, and
        not to attempt unauthorized access, reverse engineering, or data extraction.
      </p>

      <h2 className="text-2xl font-semibold text-theme-primary mt-8 mb-3">2. Account Responsibilities</h2>
      <p className="mb-4">
        You are responsible for preserving the confidentiality of your login
        credentials and for any actions taken inside your account.
      </p>

      <h2 className="text-2xl font-semibold text-theme-primary mt-8 mb-3">3. Data & Privacy</h2>
      <p className="mb-4">
        All uploaded files, notes, and analytics remain privately accessible to
        you. We do not sell personal data. For full details, refer to our Privacy
        Policy document.
      </p>

      <h2 className="text-2xl font-semibold text-theme-primary mt-8 mb-3">4. Service Modifications</h2>
      <p className="mb-4">
        We may update or improve features at any time, including beta access,
        without prior notice.
      </p>

      <h2 className="text-2xl font-semibold text-theme-primary mt-8 mb-3">5. Liability</h2>
      <p className="mb-4">
        NoteStream is provided "as-is" without guarantees of accuracy or uptime.
        We are not responsible for indirect or consequential damages.
      </p>

      <h2 className="text-2xl font-semibold text-theme-primary mt-8 mb-3">6. Contact</h2>
      <p className="mb-10">
        For account or legal inquiries, reach us at:  
        <span className="text-indigo-500"> support@notestream.app</span>
      </p>

      <p className="text-theme-muted italic">
        Last Updated: {new Date().toLocaleDateString()}
      </p>
    </section>
  );
}
