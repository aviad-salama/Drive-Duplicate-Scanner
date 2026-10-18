import { PlayIcon, PauseIcon, CancelIcon } from './icons';
import { Button } from './ui/Button';
import { he } from '../languages/he';

interface Props {
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export default function ScanControls({
  paused, onPause, onResume, onCancel,
}: Props) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {paused ? (
        <Button
          variant="default"
          size="sm"
          onClick={onResume}
        >
          <PlayIcon className="w-4 h-4 mr-2" />
          {he.actions.continue}
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={onPause}
        >
          <PauseIcon className="w-4 h-4 mr-2" />
          {he.actions.pause}
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        onClick={onCancel}
        className="scan-cancel-button"
      >
        <CancelIcon className="w-4 h-4 mr-2" />
        {he.actions.cancelScan}
      </Button>
    </div>
  );
}
