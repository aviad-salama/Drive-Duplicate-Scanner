import { PlayIcon, PauseIcon, CancelIcon } from './icons';
import { Button } from './ui/Button';
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
        <Button
          variant="success"
          size="sm"
          onClick={onResume}
        >
          <PlayIcon className="w-4 h-4" />
          המשך
        </Button>
      ) : (
        <Button
          variant="warning"
          size="sm"
          onClick={onPause}
        >
          <PauseIcon className="w-4 h-4" />
          השהה
        </Button>
      )}
      <Button
        variant="danger"
        size="sm"
        onClick={onCancel}
        className="bg-red-50 text-red-600 shadow-none hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
      >
        <CancelIcon className="w-4 h-4" />
        בטל סריקה
      </Button>
    </div>
  );
}