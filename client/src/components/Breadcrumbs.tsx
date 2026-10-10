interface Props {
  path: string | null;
}

export default function Breadcrumbs({ path }: Props) {
  if (!path) return null;

  const getPathDirection = (pathString: string): 'rtl' | 'ltr' => {
    const firstLetter = pathString.match(/[\p{L}]/u)?.[0];
    if (firstLetter && /[\u0590-\u05FF\uFB1D-\uFB4F]/u.test(firstLetter)) {
      return 'rtl';
    }
    return 'ltr';
  };

  const pathSegments = path.split('/').filter(Boolean);

  return (
    <div className="mt-2 w-full">
      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-slate-400">
        מיקום:
      </p>

      <div
        className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-gray-500 dark:text-slate-400"
        dir={getPathDirection(path)}
        title={path}
      >
        {pathSegments.map((segment, index) => (
          <span
            key={`${index}-${segment}`}
            className="inline-flex items-center gap-1"
          >
            <span
              dir="auto"
              style={{
                unicodeBidi: 'isolate',
                overflowWrap: 'anywhere',
              }}
            >
              {segment}
            </span>

            {index < pathSegments.length - 1 && (
              <span aria-hidden="true" dir="ltr">
                /
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}