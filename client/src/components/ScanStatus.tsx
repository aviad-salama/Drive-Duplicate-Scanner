interface Props {
  scanning: boolean;
  displayScanned: number;
  liveDuplicates: number;
  groupsCount: number;
}

export default function ScanStatus({ scanning, displayScanned, liveDuplicates, groupsCount }: Props) {
  if (scanning) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 text-blue-600 font-bold text-lg">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>סורק עכשיו... נסרקו {displayScanned} קבצים</span>
        </div>
        <div className="text-sm font-semibold text-red-500 mr-8 animate-pulse">
          נמצאו עד כה {liveDuplicates} סטים של כפילויות!
        </div>
      </div>
    );
  }

  return (
    <p className="text-gray-500">
      {displayScanned > 0
        ? `נסרקו ${displayScanned} קבצים. נמצאו ${groupsCount} סטים כפולים.`
        : 'מצא קבצים כפולים שמבזבזים לך מקום'}
    </p>
  );
}