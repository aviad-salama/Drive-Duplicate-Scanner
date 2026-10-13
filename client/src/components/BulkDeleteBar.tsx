import { TrashIcon } from './icons';
interface Props {
  count: number;
  disabled: boolean;
  onClick: () => void;
}

export default function BulkDeleteBar({ count, disabled, onClick }: Props) {
  return (
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex-wrap gap-4 transition-colors">
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">פעולות מהירות</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">נמצאו {count} קבצים כפולים שניתן להעביר לאשפה בבת אחת.</p>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-red-700 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
      >
        <TrashIcon className="w-5 h-5" />
        מחק הכל ({count} קבצים)
      </button>
    </div>
  );
}