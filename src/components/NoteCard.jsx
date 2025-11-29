export default function NoteCard({ note, onMenu }) {
  return (
    <div
      className="
        bg-[#111114] border border-[#26262c]
        rounded-2xl p-4 flex justify-between items-center
        active:scale-[0.98] transition
      "
    >
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-gray-100">{note.title}</h3>
        <p className="text-[11px] text-gray-500 mt-1">
          {note.tag} • {note.updated}
        </p>
      </div>

      <button
        className="text-gray-400 hover:text-white px-2 py-1"
        onClick={onMenu}
      >
        ⋮
      </button>
    </div>
  );
}
