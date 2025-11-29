// src/pages/Settings.jsx
import GlassCard from "../components/GlassCard";

export default function Settings() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          Control how NoteStream behaves across your workspace.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">Profile</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Display name</p>
              <input
                type="text"
                defaultValue="Eric Angel"
                className="w-full bg-[#101016] border border-[#26262c] rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Email</p>
              <input
                type="email"
                defaultValue="you@example.com"
                className="w-full bg-[#101016] border border-[#26262c] rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">Appearance</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-200">Theme</span>
            <button
              onClick={() => alert("Toggle theme")}
              className="px-3 py-1 rounded-full bg-[#191927] border border-[#333348] text-xs text-gray-200"
            >
              Dark · System
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">Workspace</h3>
          <p className="text-xs text-gray-400 mb-3">
            Configure how NoteStream uses AI across your workspace.
          </p>
          <label className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-200">Auto-summarize new uploads</span>
            <input type="checkbox" defaultChecked className="accent-indigo-500" />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-gray-200">Email me weekly digests</span>
            <input type="checkbox" defaultChecked={false} className="accent-indigo-500" />
          </label>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3 text-red-300">
            Danger Zone
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            These actions are destructive and cannot be undone.
          </p>
          <button
            onClick={() => alert("Account deletion flow")}
            className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-xs text-white"
          >
            Delete account
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
