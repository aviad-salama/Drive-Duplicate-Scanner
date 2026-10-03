import type { CloudFile } from '../types/cloud';
import { formatBytes } from '../utils/format';
import MediaPreview from './MediaPreview';

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
  const isVideo = file.mimeType.startsWith('video/');

  return (
    <div
      className={`bg-white p-4 rounded-xl shadow relative flex flex-col items-center transition-all ${
        isRecommendedKeep ? 'border-2 border-green-400 ring-4 ring-green-50' : 'border border-gray-200'
      }`}
    >
      {isRecommendedKeep && (
        <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
          מומלץ להשאיר (איכות מקסימלית)
        </div>
      )}
      {isRecommendedDelete && (
        <div className="absolute -top-3 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
          מומלץ למחיקה (איכות נמוכה)
        </div>
      )}

      <div className="relative w-full aspect-video mb-4 bg-gray-100 rounded-lg overflow-hidden group border border-gray-200 flex items-center justify-center">
        <MediaPreview file={file} isVideo={isVideo} accountId={accountId} />
        {file.webViewLink && (
          <a
            href={file.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/40 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            title="לצפייה בדרייב"
          >
            <div className="bg-white/90 rounded-full p-4 shadow-lg transform transition-transform group-hover:scale-110">
              {isVideo ? (
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </div>
          </a>
        )}
      </div>

      <div className="w-full text-right mb-2">
        <p className="text-base font-semibold text-gray-800 truncate" title={file.name}>
          {file.name}
        </p>
        <div className="flex gap-2 items-center mt-2 flex-wrap">
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold border border-gray-200">
            {formatBytes(file.size)}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
            {isVideo ? 'וידאו' : 'תמונה'}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(file)}
        className="mt-auto w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100"
      >
        מחק קובץ זה
      </button>
    </div>
  );
}