import { PauseIcon, SpinnerIcon } from './icons';
import { Text } from './ui/Typography';
import { he } from '../languages/he';
interface Props {
  scanning: boolean;
  paused: boolean;
  cancelled: boolean;
  displayScanned: number;
  liveDuplicates: number;
  groupsCount: number;
  currentAccount: string;
}

export default function ScanStatus({
  scanning,
  paused,
  cancelled,
  displayScanned,
  liveDuplicates,
  groupsCount,
  currentAccount,
}: Props) {
  let idleMessage = he.scan.idle;

  if (cancelled) {
    idleMessage = he.scan.cancelled(displayScanned, groupsCount);
  } else if (displayScanned > 0) {
    idleMessage = he.scan.completed(displayScanned, groupsCount);
  }

  if (scanning) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className={`flex items-center gap-3 font-bold text-lg ${paused ? 'text-amber-600' : 'text-teal-700 dark:text-teal-300'}`}
        >
          {paused ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <SpinnerIcon className="animate-spin h-5 w-5" />
          )}
          <span>
            {paused ? he.scan.paused : he.scan.running} {he.scan.scanned(displayScanned)}
          </span>
        </div>
        {currentAccount && (
          <Text size="sm" variant="dimmed" className="mr-8">{he.scan.currentAccount(currentAccount)}</Text>
        )}
        <Text as="div" size="sm" variant="danger" className="mr-8 font-semibold">
          {he.scan.duplicatesFound(liveDuplicates)}
        </Text>
      </div>
    );
  }

  return (
    <Text variant="dimmed">{idleMessage}</Text>
  );
}