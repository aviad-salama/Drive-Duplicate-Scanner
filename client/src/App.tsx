import { useState } from 'react';

const API = 'http://localhost:3000';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  md5Checksum?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

// Interface for the new grouped response from the server
interface DuplicateGroup {
  type: 'exact' | 'quality';
  files: DriveFile[];
}

// Helper function to format bytes into MB
const formatBytes = (bytes?: string) => {
  if (!bytes) return 'N/A';
  return (parseInt(bytes) / (1024 * 1024)).toFixed(2) + ' MB';
};

// ==========================================
// User's custom MediaPreview component (Unchanged)
// ==========================================
function MediaPreview({ file, isVideo }: { file: DriveFile; isVideo: boolean }) {
  const sources: { type: 'img' | 'video'; src: string }[] = [];

  if (file.thumbnailLink) {
    sources.push({
      type: 'img',
      src: file.thumbnailLink.replace(/=s\d+$/, '=s600'),
    });
  }

  if (isVideo) {
    sources.push({
      type: 'video',
      src: `${API}/api/drive/file/${file.id}#t=0.5`,
    });
  }

  const [index, setIndex] = useState(0);
  const next = () => setIndex(i => i + 1);
  const current = sources[index];

  if (!current) {
    return (
      <div className="text-gray-400 flex flex-col items-center gap-2">
        {isVideo ? (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        <span className="text-sm font-medium">
          {isVideo ? 'וידאו חסר תצוגה' : 'אין תצוגה מקדימה'}
        </span>
      </div>
    );
  }

  return current.type === 'img' ? (
    <img
      src={current.src}
      alt={file.name}
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
      onError={next}
    />
  ) : (
    <video
      src={current.src}
      className="w-full h-full object-cover"
      preload="metadata"
      muted
      playsInline
      onError={next}
    />
  );
}

// ==========================================
// Main App Component
// ==========================================
function App() {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannedCount, setScannedCount] = useState(0);

  const handleScan = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/api/drive/scan`);
      const data = await response.json();

      if (data.success) {
        setDuplicateGroups(data.duplicateGroups);
        setScannedCount(data.totalScanned);
      } else {
        setError(data.message || 'Failed to fetch files');
      }
    } catch (err) {
      setError('Network error: Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto">

        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">סורק הכפילויות בדרייב</h1>
            <p className="text-gray-500 mt-1">
              {scannedCount > 0 ? `נסרקו ${scannedCount} קבצים. נמצאו ${duplicateGroups.length} סטים כפולים.` : 'מצא תמונות וסרטונים כפולים שמבזבזים לך מקום'}
            </p>
          </div>

          <button
            onClick={handleScan}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'סורק ומאתר כפילויות...' : 'התחל סריקה'}
          </button>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {duplicateGroups.map((groupObj, index) => {
            const { type, files: group } = groupObj;
            const isQuality = type === 'quality';

            return (
              <div key={index} className="bg-red-50/30 p-6 rounded-2xl border border-red-100 shadow-sm">
                <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                  <span className="bg-red-200 text-red-900 px-3 py-1 rounded-full text-sm">סט #{index + 1}</span>
                  {group.length === 2 
                    ? 'אותו קובץ מופיע פעמיים' 
                    : `אותו קובץ מופיע ${group.length} פעמים`}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
                  {group.map((file, fileIndex) => {
                    const isVideo = file.mimeType?.startsWith('video/');
                    const isRecommendedKeep = isQuality && fileIndex === 0;
                    const isRecommendedDelete = isQuality && fileIndex > 0;

                    return (
                      <div key={file.id} className={`bg-white p-4 rounded-xl shadow relative flex flex-col items-center transition-all ${isRecommendedKeep ? 'border-2 border-green-400 ring-4 ring-green-50' : 'border border-gray-200'}`}>

                        {/* Smart recommendation tags based on file size */}
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

                          {/* Rendering the user's custom component */}
                          <MediaPreview file={file} isVideo={isVideo} />

                          {/* Hover overlay for external viewing */}
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
                                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                ) : (
                                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                )}
                              </div>
                            </a>
                          )}
                        </div>

                        {/* File metadata details */}
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

                        <button className="mt-auto w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100">
                          מחק קובץ זה
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default App;