interface Props {
  count: number;
  disabled: boolean;
  onClick: () => void;
}

export default function BulkDeleteBar({ count, disabled, onClick }: Props) {
  return (
    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-wrap gap-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">פעולות מהירות</h3>
        <p className="text-sm text-gray-500">נמצאו {count} קבצים כפולים שניתן להעביר לאשפה בבת אחת.</p>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-red-700 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        מחק הכל ({count} קבצים)
      </button>
    </div>
  );
}