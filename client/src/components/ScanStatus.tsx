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
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>
            {paused ? 'הסריקה מושהית' : 'סורק עכשיו...'} נסרקו {displayScanned} קבצים
          </span>
        </div>
        {currentAccount && (
          <div className="text-sm text-gray-500 mr-8">חשבון נוכחי: {currentAccount}</div>
        )}
        <div className="text-sm font-semibold text-red-500 mr-8">
          נמצאו עד כה {liveDuplicates} סטים של כפילויות!
        </div>
      </div>
    );
  }

  return (
    <p className="text-gray-500">
      {cancelled
        ? `הסריקה בוטלה. נסרקו ${displayScanned} קבצים, נמצאו ${groupsCount} סטים כפולים עד כה.`
        : displayScanned > 0
        ? `נסרקו ${displayScanned} קבצים. נמצאו ${groupsCount} סטים כפולים.`
        : 'מצא קבצים כפולים שמבזבזים לך מקום'}
    </p>
  );
}