import { generateSmartSummary } from "./smartSummary";

// Allowed formats for uploads
const ALLOWED_TYPES = ["PDF", "DOCX", "XLSX"];

/* ------------------------------------------------
   Toast (no extra file needed)
-------------------------------------------------- */
function showToast(message, type = "error") {
  const el = document.getElementById("global-toast");
  if (!el) return;

  el.textContent = message;

  const isError = type === "error";
  el.className = `
    fixed bottom-6 left-1/2 -translate-x-1/2
    px-4 py-3 rounded-xl text-sm font-medium shadow-xl
    backdrop-blur-md z-[9999] transition-all duration-300
    ${
      isError
        ? "bg-rose-900/70 text-rose-200 border border-rose-500/40"
        : "bg-green-900/70 text-green-200 border border-green-500/40"
    }`;

  setTimeout(() => {
    el.classList.add("opacity-0");
    setTimeout(() => {
      el.className = "hidden";
    }, 350);
  }, 3200);
}

/* ------------------------------------------------
   Local Blob fallback (used in Viewer if no fileUrl)
-------------------------------------------------- */
export function createLocalBlob(doc) {
  const blob = new Blob([`Mock content for ${doc.name}`], {
    type: "text/plain"
  });
  return URL.createObjectURL(blob);
}

/* ------------------------------------------------
   Download Helper (auto MIME & safe naming)
-------------------------------------------------- */
export function downloadDocument(doc) {
  const fileUrl = doc.fileUrl || createLocalBlob(doc);

  const cleanName = (doc.name || "Document")
    .replace(/[^a-zA-Z0-9_\-\.]/g, "_");

  const ext =
    doc.type === "PDF" ? "pdf" :
    doc.type === "DOCX" ? "docx" :
    doc.type === "XLSX" ? "xlsx" :
    "file";

  const filename =
    cleanName.toLowerCase().endsWith(`.${ext}`)
      ? cleanName
      : `${cleanName}.${ext}`;

  const link = document.createElement("a");
  link.href = fileUrl;
  link.setAttribute("download", filename);

  const mime =
    doc.type === "PDF"
      ? "application/pdf"
      : doc.type === "DOCX"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : doc.type === "XLSX"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/octet-stream";

  link.setAttribute("type", mime);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* ------------------------------------------------
   Smart Summary Apply
-------------------------------------------------- */
export function applySmartSummary(doc, setDocs) {
  const summary = generateSmartSummary(doc);

  setDocs((prev) =>
    prev.map((d) => (d.id === doc.id ? { ...d, smartSummary: summary } : d))
  );

  showToast("Smart summary generated!", "success");
}

/* ------------------------------------------------
   Upload Validation + Insert New Document
-------------------------------------------------- */
export function handleFileUpload(event, setDocs, setShowUploader) {
  const file = event.target.files?.[0];
  if (!file) return;

  const extension = file.name.split(".").pop()?.toUpperCase();

  if (!ALLOWED_TYPES.includes(extension)) {
    showToast(
      `.${extension} is not supported. Allowed: PDF, DOCX, XLSX only.`,
      "error"
    );
    return;
  }

  const newDoc = {
    id: `doc-${Date.now()}`,
    name: file.name,
    type: extension,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    updated: "Just now",
    fileUrl: URL.createObjectURL(file),
  };

  setDocs((prev) => [newDoc, ...prev]);
  setShowUploader(false);

  showToast(`Uploaded: ${newDoc.name}`, "success");
}
