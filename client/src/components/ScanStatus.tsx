import { PauseIcon, SpinnerIcon } from './icons';
import { Text } from './ui/Typography';
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
            {paused ? 'הסריקה מושהית' : 'סורק עכשיו...'} נסרקו {displayScanned} קבצים
          </span>
        </div>
        {currentAccount && (
          <Text size="sm" variant="dimmed" className="mr-8">חשבון נוכחי: {currentAccount}</Text>
        )}
        <Text as="div" size="sm" variant="danger" className="mr-8 font-semibold">
          נמצאו עד כה {liveDuplicates} סטים של כפילויות!
        </Text>
      </div>
    );
  }

  return (
    <Text variant="dimmed">
      {cancelled
        ? `הסריקה בוטלה. נסרקו ${displayScanned} קבצים, נמצאו ${groupsCount} סטים כפולים עד כה.`
        : displayScanned > 0
        ? `נסרקו ${displayScanned} קבצים. נמצאו ${groupsCount} סטים כפולים.`
        : 'מצא קבצים כפולים שמבזבזים לך מקום'}
    </Text>
  );
}