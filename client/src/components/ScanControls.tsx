import { PlayIcon, PauseIcon, CancelIcon } from './icons';
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
          <PlayIcon className="w-4 h-4" />
          המשך
        </button>
      ) : (
        <button
          onClick={onPause}
          className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600"
        >
          <PauseIcon className="w-4 h-4" />
          השהה
        </button>
      )}
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100"
      >
        <CancelIcon className="w-4 h-4" />
        בטל סריקה
      </button>
    </div>
  );
}