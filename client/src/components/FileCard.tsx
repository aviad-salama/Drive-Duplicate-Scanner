
import type { CloudFile } from '../types/cloud';
import { formatBytes } from '../utils/format';
import MediaPreview from './MediaPreview';
import CloudBadge from './CloudBadge';

interface Props {
  file: CloudFile;
  accountId: string;
  isRecommendedKeep: boolean;
  isRecommendedDelete: boolean;
  onDelete: (file: CloudFile) => void;
}

export default function FileCard({
  file,
  accountId,
  isRecommendedKeep,
  isRecommendedDelete,
  onDelete,
}: Props) {
  
  const getPathDirection = (path: string): 'rtl' | 'ltr' => {
    const firstLetter = path.match(/[\p{L}]/u)?.[0];

    if (firstLetter && /[\u0590-\u05FF\uFB1D-\uFB4F]/u.test(firstLetter)) {
      return 'rtl';
    }

    return 'ltr';
  };

  const isVideo = file.mimeType.startsWith('video/');

  const pathSegments = file.path
    ? file.path.split('/').filter(Boolean)
    : [];

  return (
    <div
      className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow relative flex flex-col items-center transition-all ${
        isRecommendedKeep
          ? 'border-2 border-emerald-400 dark:border-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-900/30'
          : 'border border-gray-200 dark:border-slate-700'
      }`}
    >
      {isRecommendedKeep && (
        <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
          יישמר (מועדף)
        </div>
      )}

      {isRecommendedDelete && (
        <div className="absolute -top-3 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
          יימחק (לפי תעדוף)
        </div>
      )}

      <div className="relative w-full aspect-video mb-4 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden group border border-gray-200 dark:border-slate-700 flex items-center justify-center">
        <MediaPreview
          file={file}
          isVideo={isVideo}
          accountId={file.accountId ?? accountId}
        />

        {file.webViewLink && (
          <a
            href={file.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/40 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            title="Open in Cloud"
          >
            <div className="bg-white/90 rounded-full p-4 shadow-lg transform transition-transform group-hover:scale-110">
              {isVideo ? (
                <svg
                  className="w-8 h-8 text-teal-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              )}
            </div>
          </a>
        )}

        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <CloudBadge
            provider={file.provider}
            email={file.accountEmail}
          />
        </div>
      </div>

      <div className="w-full text-right mb-2">
        <p
          className="text-base font-semibold text-gray-800 dark:text-slate-200 truncate"
          title={file.name}
          dir="auto"
        >
          {file.name}
        </p>

        {file.path && (
          <div className="mt-2 w-full">
            <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-slate-400">
              מיקום:
            </p>

            <div
              className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-gray-500 dark:text-slate-400"
              dir={getPathDirection(file.path)}
              title={file.path}
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
        )}

        <div className="flex gap-2 items-center mt-2 flex-wrap">
          <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-1 rounded font-bold border border-gray-200 dark:border-slate-700">
            {formatBytes(file.size)}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(file)}
        className="mt-auto w-full py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 transition-colors border border-red-100 dark:border-red-900/50"
      >
        מחק קובץ זה
      </button>
    </div>
  );
}
