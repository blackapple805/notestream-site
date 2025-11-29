// src/pages/NoteView.jsx
import {
  FiArrowLeft,
  FiHeart,
  FiLock,
  FiTrash2,
  FiEdit2,
  FiZap,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export default function NoteView({
  note,
  onBack,
  onFavoriteToggle,
  onEditSave,
  onDelete,
  onLockToggle,
}) {
  const [showToast, setShowToast] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Local state for smart notes data
  const [smartData, setSmartData] = useState({
    summary: note.summary || null,
    SmartTasks: note.SmartTasks || null,
    SmartHighlights: note.SmartHighlights || null,
    SmartSchedule: note.SmartSchedule || null,
  });

  const textareaRef = useRef(null);

  const formatRelative = (date) => {
    const diffMs = Date.now() - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return navigator.language.startsWith("fr") ? "À l'instant" : "Just now";
    if (diffHrs < 1)
      return navigator.language.startsWith("fr")
        ? `${diffMins} min`
        : `${diffMins}m ago`;
    if (diffDays < 1)
      return navigator.language.startsWith("fr")
        ? `${diffHrs} h`
        : `${diffHrs}h ago`;
    return navigator.language.startsWith("fr")
      ? `${diffDays} j`
      : `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const autoResize = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  };

  useEffect(() => {
    if (isEditing) autoResize();
  }, [body, isEditing]);

  const handleEditToggle = () => {
    if (isEditing) {
      onEditSave(note.id, title, body, new Date().toISOString());
    }
    setIsEditing(!isEditing);
  };

  const fakeSmartNotes = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const newSmartData = {
        summary: "Quick focus: UI components must be completed before the meeting tomorrow at 3 PM.",
        SmartTasks: ["Finish UI components", "Request updated Figma from Sarah"],
        SmartHighlights: ["Dashboard layout is highest priority"],
        SmartSchedule: ["Meeting tomorrow at 3 PM"],
      };
      
      // Update local state
      setSmartData(newSmartData);
      setIsAnalyzing(false);
      setShowToast(true);
      
      setTimeout(() => setShowToast(false), 3000);
      
      // Save to parent with correct function signature
      onEditSave(note.id, title, body, new Date().toISOString());
    }, 2000);
  };

  return (
    <div className="animate-fadeIn min-h-full w-full py-16 px-5 text-gray-200">
      <div className="flex items-center justify-between mb-6">
        <button className="text-gray-400 active:scale-90" onClick={onBack}>
          <FiArrowLeft size={22} />
        </button>
        <div className="flex gap-5 items-center">
          <button
            disabled={isAnalyzing}
            onClick={() => onFavoriteToggle(note.id, true)}
            className={`active:scale-90 transition ${note.favorite ? "text-rose-400" : "text-gray-400 hover:text-rose-300"}`}
            title="Favorite"
          >
            <FiHeart size={20} />
          </button>
          <button
            disabled={isAnalyzing}
            onClick={fakeSmartNotes}
            className={`active:scale-90 transition ${isAnalyzing ? "text-indigo-300" : "text-gray-300 hover:text-indigo-400"}`}
            title="Smart AI Analysis"
          >
            <FiZap size={19} />
          </button>
          <button
            disabled={isAnalyzing}
            onClick={() => onLockToggle(note.id, true)}
            className={`active:scale-90 transition ${note.locked ? "text-yellow-300" : "text-gray-400 hover:text-white"}`}
            title={note.locked ? "Unlock" : "Lock"}
          >
            <FiLock size={18} />
          </button>
          <button
            disabled={isAnalyzing}
            onClick={() => setShowDeleteConfirm(true)}
            className="active:scale-90 text-gray-400 hover:text-rose-400 transition"
            title="Delete"
          >
            <FiTrash2 size={18} />
          </button>
          <button
            disabled={isAnalyzing}
            onClick={handleEditToggle}
            title={isEditing ? "Save" : "Edit"}
            className={`active:scale-90 transition ${isEditing ? "text-indigo-400" : "text-gray-400 hover:text-white"}`}
          >
            <FiEdit2 size={18} />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 tracking-wide">
        {note.updated ? new Date(note.updated).toLocaleDateString(navigator.language || "en-US", { year: "numeric", month: "short", day: "numeric" }) : ""}
      </p>
      <p className="text-[11px] text-gray-500 mb-4">
        {note.updated ? formatRelative(note.updated) : ""}
      </p>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[400] bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fadeIn">
          ✨ Smart Notes analysis complete!
        </div>
      )}

      {isAnalyzing && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-gradient-to-b from-[#0d0d10]/95 to-[#0d0d10]/70 backdrop-blur-xl border-b border-indigo-500/20 flex flex-col items-center justify-center py-4 animate-fadeIn">
          <div className="w-40 h-1.5 bg-[#1c1c24] rounded-full overflow-hidden mb-3">
            <div className="h-full w-full bg-indigo-500 animate-[loadbar_1.2s_infinite]" />
          </div>
          <p className="text-xs text-indigo-300 tracking-wide">Analyzing with AI…</p>
        </div>
      )}

      {note.imageUrl && (
        <img src={note.imageUrl} alt="Note upload" className="w-full max-h-[62vh] object-contain rounded-xl mb-5" />
      )}

      {note.pdfUrl && (
        <div className="w-full flex flex-col items-center gap-4 mb-6 p-4 bg-[#15151d] border border-indigo-500/20 rounded-xl">
          <p className="text-gray-400 text-sm">PDF Document</p>
          <a href={note.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">
            Open PDF
          </a>
        </div>
      )}

      {isEditing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          className="w-full bg-transparent border-b border-gray-700 text-white text-2xl font-bold pb-1 focus:outline-none"
        />
      ) : (
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
      )}

      {!isEditing && (smartData.SmartTasks || smartData.SmartHighlights || smartData.SmartSchedule) && (
        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 font-medium px-2.5 py-[3px] rounded-full bg-indigo-500/10 border border-indigo-500/20 drop-shadow-[0_0_6px_rgba(99,102,241,0.35)] transition ease-out animate-fadeIn mb-3">
          Enhanced with Smart Notes ✨
        </span>
      )}

      {isEditing ? (
        <textarea
          ref={textareaRef}
          rows={4}
          className="w-full bg-transparent border-b border-gray-700 text-gray-300 text-[15px] resize-none leading-relaxed focus:outline-none whitespace-pre-wrap break-words max-w-full"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      ) : (
        body && (
          <div className="max-w-full text-[15px] text-gray-300 leading-relaxed whitespace-pre-wrap break-words mb-20 px-[2px]">
            {body}
          </div>
        )
      )}

      {!isEditing && (smartData.SmartTasks || smartData.SmartHighlights || smartData.SmartSchedule) && (
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8 }}
          className="h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent my-10"
        />
      )}

      {!isEditing && note.extractedText && (
        <div className="mb-6 p-3 bg-[#1a1a21] border border-[#2a2a32] rounded-xl">
          <h3 className="font-semibold text-white mb-2">Extracted Text</h3>
          <p className="text-gray-300 text-[14px] whitespace-pre-wrap">{note.extractedText}</p>
        </div>
      )}

      {!isEditing && (smartData.SmartTasks || smartData.SmartHighlights || smartData.SmartSchedule) && (
        <div className="mt-8 space-y-7">
          {smartData.summary && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="bg-[#15151d] border border-indigo-500/20 rounded-xl p-4">
              <h3 className="text-indigo-300 font-medium mb-2">Summary:</h3>
              <p className="text-gray-300 text-[14px] leading-relaxed">{smartData.summary}</p>
            </motion.div>
          )}
          {smartData.SmartTasks?.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="bg-[#15151d] border border-indigo-500/20 rounded-xl p-4">
              <p className="text-indigo-300 font-medium mb-2">Tasks:</p>
              <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                {smartData.SmartTasks.map((task, i) => (<li key={i}>{task}</li>))}
              </ul>
            </motion.div>
          )}
          {smartData.SmartHighlights?.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="bg-[#15151d] border border-indigo-500/20 rounded-xl p-4">
              <p className="text-indigo-300 font-medium mb-2">Important:</p>
              <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                {smartData.SmartHighlights.map((imp, i) => (<li key={i}>{imp}</li>))}
              </ul>
            </motion.div>
          )}
          {smartData.SmartSchedule?.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="bg-[#15151d] border border-indigo-500/20 rounded-xl p-4">
              <p className="text-indigo-300 font-medium mb-2">Schedule:</p>
              <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                {smartData.SmartSchedule.map((date, i) => (<li key={i}>{date}</li>))}
              </ul>
            </motion.div>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-md flex items-center justify-center px-6">
          <div className="bg-[#111114] border border-[#2b2b34] rounded-2xl w-full max-w-[360px] p-6 shadow-xl animate-fadeIn">
            <h3 className="text-lg font-semibold text-white mb-3">Delete Note?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone. Are you sure?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-md bg-[#1c1c24] text-gray-300 hover:bg-[#262631] transition">Cancel</button>
              <button onClick={() => { onDelete(note.id); setShowDeleteConfirm(false); }} className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
