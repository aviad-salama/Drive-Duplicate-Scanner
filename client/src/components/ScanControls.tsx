interface Props {
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export default function ScanControls({ paused, onPause, onResume, onCancel }: Props) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {paused ? (
        <button
          onClick={onResume}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          המשך
        </button>
      ) : (
        <button
          onClick={onPause}
          className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
          השהה
        </button>
      )}
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        בטל סריקה
      </button>
    </div>
  );
}