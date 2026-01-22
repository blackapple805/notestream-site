// src/pages/TeamCollaboration.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  PencilSimple,
  Eye,
  Chat,
  CheckCircle,
  Warning,
  Clock,
  FolderOpen,
  FileText,
  Plus,
  DotsThree,
  ArrowLeft,
  MagnifyingGlass,
  Envelope,
  Copy,
  Link,
  Trash,
  Shield,
  Gear,
  Bell,
  Export,
} from "phosphor-react";
import { FiX, FiCheck, FiMail, FiCopy, FiLink, FiTrash2, FiSettings, FiUsers, FiFolder } from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

export default function TeamCollaboration() {
  const navigate = useNavigate();
  const { subscription, isFeatureUnlocked, PLANS } = useSubscription();
  const isTeamPlan = subscription.plan === "team";
  const isUnlocked = isFeatureUnlocked("collab");

  // Redirect non-Team users
  useEffect(() => {
    if (!isTeamPlan || !isUnlocked) {
      navigate("/dashboard/ai-lab");
    }
  }, [isTeamPlan, isUnlocked, navigate]);

  // Team members state
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "You",
      email: "you@example.com",
      role: "owner",
      avatar: null,
      status: "online",
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      name: "Alex Chen",
      email: "alex@example.com",
      role: "admin",
      avatar: null,
      status: "online",
      joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: 3,
      name: "Sarah Kim",
      email: "sarah@example.com",
      role: "editor",
      avatar: null,
      status: "away",
      joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]);

  // Shared workspaces state
  const [workspaces, setWorkspaces] = useState([
    {
      id: 1,
      name: "Marketing Team",
      description: "Campaign briefs, content plans, and brand assets",
      memberCount: 3,
      noteCount: 12,
      color: "emerald",
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 2,
      name: "Product Development",
      description: "PRDs, research notes, and sprint planning",
      memberCount: 2,
      noteCount: 8,
      color: "indigo",
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ]);

  // Recent activity
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, user: "Alex Chen", action: "edited", item: "Q4 Marketing Brief", time: "2 hours ago", workspace: "Marketing Team" },
    { id: 2, user: "Sarah Kim", action: "commented on", item: "Product Roadmap", time: "5 hours ago", workspace: "Product Development" },
    { id: 3, user: "You", action: "created", item: "Campaign Ideas", time: "1 day ago", workspace: "Marketing Team" },
    { id: 4, user: "Alex Chen", action: "shared", item: "Competitor Analysis", time: "2 days ago", workspace: "Marketing Team" },
  ]);

  // UI State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState("emerald");
  const [activeTab, setActiveTab] = useState("members"); // members, workspaces, activity
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const teamPlan = PLANS?.team;
  const maxMembers = teamPlan?.limits?.teamMembers || 10;
  const remainingSeats = maxMembers - teamMembers.length;

  const colorOptions = [
    { id: "emerald", class: "bg-emerald-500" },
    { id: "indigo", class: "bg-indigo-500" },
    { id: "rose", class: "bg-rose-500" },
    { id: "amber", class: "bg-amber-500" },
    { id: "sky", class: "bg-sky-500" },
    { id: "purple", class: "bg-purple-500" },
  ];

  const roleColors = {
    owner: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
    admin: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" },
    editor: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
    viewer: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
  };

  const statusColors = {
    online: "bg-emerald-500",
    away: "bg-amber-500",
    offline: "bg-slate-500",
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setInviteSending(true);
    
    // Simulate sending invite
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add pending member
    const newMember = {
      id: Date.now(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: null,
      status: "offline",
      pending: true,
      joinedAt: new Date(),
    };
    
    setTeamMembers(prev => [...prev, newMember]);
    setInviteSending(false);
    setInviteSuccess(true);
    
    setTimeout(() => {
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("editor");
      setInviteSuccess(false);
    }, 2000);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    const newWorkspace = {
      id: Date.now(),
      name: newWorkspaceName,
      description: newWorkspaceDesc,
      memberCount: 1,
      noteCount: 0,
      color: selectedColor,
      lastActivity: new Date(),
    };
    
    setWorkspaces(prev => [...prev, newWorkspace]);
    setShowCreateWorkspace(false);
    setNewWorkspaceName("");
    setNewWorkspaceDesc("");
    setSelectedColor("emerald");
  };

  const handleRemoveMember = (memberId) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    setShowMemberMenu(null);
  };

  const handleChangeRole = (memberId, newRole) => {
    setTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
    setShowMemberMenu(null);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText("https://notestream.app/invite/abc123xyz");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isTeamPlan || !isUnlocked) {
    return null;
  }

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Header */}
      <header className="pt-2 px-1">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/dashboard/ai-lab")}
            className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">Team Collaboration</h1>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <Users size={14} weight="fill" className="text-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-500">TEAM</span>
              </div>
            </div>
            <p className="text-theme-muted text-sm mt-0.5">
              Manage your team, shared workspaces, and collaboration settings.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="text-center py-4">
          <div className="text-2xl font-bold text-theme-primary">{teamMembers.length}</div>
          <div className="text-xs text-theme-muted">Team Members</div>
          <div className="text-[10px] text-emerald-400 mt-1">{remainingSeats} seats left</div>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <div className="text-2xl font-bold text-theme-primary">{workspaces.length}</div>
          <div className="text-xs text-theme-muted">Workspaces</div>
          <div className="text-[10px] text-theme-muted mt-1">Shared folders</div>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <div className="text-2xl font-bold text-theme-primary">
            {workspaces.reduce((acc, w) => acc + w.noteCount, 0)}
          </div>
          <div className="text-xs text-theme-muted">Shared Notes</div>
          <div className="text-[10px] text-theme-muted mt-1">Across all spaces</div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition active:scale-[0.98]"
        >
          <UserPlus size={18} weight="bold" />
          Invite Member
        </button>
        <button
          onClick={() => setShowCreateWorkspace(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-sm text-theme-secondary hover:bg-white/5 transition active:scale-[0.98]"
          style={{ borderColor: "var(--border-secondary)" }}
        >
          <Plus size={18} weight="bold" />
          New Workspace
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-tertiary)" }}>
        {[
          { id: "members", label: "Members", icon: FiUsers },
          { id: "workspaces", label: "Workspaces", icon: FiFolder },
          { id: "activity", label: "Activity", icon: Clock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-white/10 text-theme-primary"
                : "text-theme-muted hover:text-theme-secondary"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== "activity" && (
        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "members" ? "Search members..." : "Search workspaces..."}
            className="w-full pl-11 pr-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
            style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
          />
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "members" && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {filteredMembers.map((member) => (
              <GlassCard key={member.id} className="relative">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold"
                      style={{ backgroundColor: "var(--bg-tertiary)" }}
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span className="text-theme-secondary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 ${statusColors[member.status]}`}
                      style={{ borderColor: "var(--bg-surface)" }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-theme-primary truncate">{member.name}</h4>
                      {member.pending && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-theme-muted truncate">{member.email}</p>
                  </div>

                  {/* Role Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role].bg} ${roleColors[member.role].text} border ${roleColors[member.role].border}`}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </div>

                  {/* Actions */}
                  {member.role !== "owner" && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMemberMenu(showMemberMenu === member.id ? null : member.id)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                        style={{ backgroundColor: "var(--bg-tertiary)" }}
                      >
                        <DotsThree size={20} weight="bold" />
                      </button>

                      <AnimatePresence>
                        {showMemberMenu === member.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-10 overflow-hidden"
                            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
                          >
                            <div className="p-1">
                              <p className="px-3 py-2 text-[10px] font-semibold text-theme-muted uppercase tracking-wide">
                                Change Role
                              </p>
                              {["admin", "editor", "viewer"].map(role => (
                                <button
                                  key={role}
                                  onClick={() => handleChangeRole(member.id, role)}
                                  className={`w-full px-3 py-2 text-left text-sm rounded-lg transition flex items-center justify-between ${
                                    member.role === role ? "bg-emerald-500/10 text-emerald-400" : "text-theme-secondary hover:bg-white/5"
                                  }`}
                                >
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                  {member.role === role && <FiCheck size={14} />}
                                </button>
                              ))}
                              <div className="h-px my-1" style={{ backgroundColor: "var(--border-secondary)" }} />
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition flex items-center gap-2"
                              >
                                <FiTrash2 size={14} />
                                Remove Member
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </GlassCard>
            ))}

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-theme-muted mb-3 opacity-50" />
                <p className="text-theme-muted">No members found</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "workspaces" && (
          <motion.div
            key="workspaces"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {filteredWorkspaces.map((workspace) => (
              <GlassCard
                key={workspace.id}
                className="cursor-pointer hover:border-emerald-500/30 transition"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-${workspace.color}-500/20`}
                  >
                    <FolderOpen size={24} weight="duotone" className={`text-${workspace.color}-400`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-theme-primary">{workspace.name}</h4>
                    <p className="text-sm text-theme-muted line-clamp-1">{workspace.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-theme-muted">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {workspace.memberCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {workspace.noteCount} notes
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-theme-muted">Last activity</p>
                    <p className="text-xs text-theme-secondary">
                      {formatTimeAgo(workspace.lastActivity)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}

            {filteredWorkspaces.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen size={48} className="mx-auto text-theme-muted mb-3 opacity-50" />
                <p className="text-theme-muted">No workspaces found</p>
                <button
                  onClick={() => setShowCreateWorkspace(true)}
                  className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition"
                >
                  Create your first workspace →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {recentActivity.map((activity) => (
              <GlassCard key={activity.id}>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    <span className="text-sm font-semibold text-theme-secondary">
                      {activity.user.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-secondary">
                      <span className="font-medium text-theme-primary">{activity.user}</span>
                      {" "}{activity.action}{" "}
                      <span className="font-medium text-theme-primary">{activity.item}</span>
                    </p>
                    <p className="text-xs text-theme-muted">
                      in {activity.workspace} • {activity.time}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => !inviteSending && setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              {inviteSuccess ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle size={48} weight="fill" className="text-emerald-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-theme-primary mb-2">Invite Sent!</h2>
                  <p className="text-theme-muted">
                    An invitation has been sent to {inviteEmail}
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-theme-primary">Invite Team Member</h2>
                        <p className="text-sm text-theme-muted mt-1">
                          {remainingSeats} seats remaining on your plan
                        </p>
                      </div>
                      <button
                        onClick={() => setShowInviteModal(false)}
                        disabled={inviteSending}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition disabled:opacity-50"
                        style={{ backgroundColor: "var(--bg-tertiary)" }}
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-theme-muted mb-2 block">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@company.com"
                          disabled={inviteSending}
                          className="w-full px-4 py-3 pl-11 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-emerald-500/50 transition disabled:opacity-50"
                          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                        />
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-theme-muted mb-2 block">Role</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "admin", label: "Admin", desc: "Full access" },
                          { id: "editor", label: "Editor", desc: "Can edit" },
                          { id: "viewer", label: "Viewer", desc: "Read only" },
                        ].map(role => (
                          <button
                            key={role.id}
                            onClick={() => setInviteRole(role.id)}
                            disabled={inviteSending}
                            className={`p-3 rounded-xl border text-center transition ${
                              inviteRole === role.id
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : "hover:bg-white/5"
                            }`}
                            style={{ borderColor: inviteRole === role.id ? undefined : "var(--border-secondary)" }}
                          >
                            <p className={`text-sm font-medium ${inviteRole === role.id ? "text-emerald-400" : "text-theme-primary"}`}>
                              {role.label}
                            </p>
                            <p className="text-[10px] text-theme-muted">{role.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={copyInviteLink}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm text-theme-secondary hover:bg-white/5 transition"
                        style={{ borderColor: "var(--border-secondary)" }}
                      >
                        {copiedLink ? (
                          <>
                            <FiCheck className="text-emerald-400" />
                            <span className="text-emerald-400">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <FiLink />
                            Copy Invite Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                    <button
                      onClick={handleInvite}
                      disabled={inviteSending || !inviteEmail.trim() || remainingSeats <= 0}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/25 transition"
                    >
                      {inviteSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending Invite...
                        </>
                      ) : (
                        <>
                          <Envelope size={18} weight="bold" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateWorkspace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowCreateWorkspace(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              <div className="p-6 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-theme-primary">Create Workspace</h2>
                    <p className="text-sm text-theme-muted mt-1">
                      A shared space for your team
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateWorkspace(false)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">Workspace Name</label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="e.g., Marketing Team"
                    className="w-full px-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                    style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">Description (optional)</label>
                  <textarea
                    value={newWorkspaceDesc}
                    onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                    placeholder="What's this workspace for?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-emerald-500/50 transition resize-none"
                    style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">Color</label>
                  <div className="flex gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={`h-10 w-10 rounded-xl ${color.class} transition ${
                          selectedColor === color.id ? "ring-2 ring-offset-2 ring-offset-[var(--bg-surface)]" : "opacity-60 hover:opacity-100"
                        }`}
                        style={{ 
                          ringColor: selectedColor === color.id ? "white" : undefined 
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspaceName.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/25 transition"
                >
                  <Plus size={18} weight="bold" />
                  Create Workspace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function
function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}