export default function ActionButtons({ onArchive, onDelete }) {
  return (
    <div className="absolute right-3 inset-y-0 flex items-center gap-2">
      <button
        className="
          rounded-lg px-3 py-1 text-xs
          bg-indigo-600/15 text-indigo-200
          border border-indigo-500/25
        "
        onClick={(e) => {
          e.stopPropagation();
          onArchive();
        }}
      >
        Archive
      </button>

      <button
        className="
          rounded-lg px-3 py-1 text-xs
          bg-rose-600/15 text-rose-200
          border border-rose-500/25
        "
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        Delete
      </button>
    </div>
  );
}
