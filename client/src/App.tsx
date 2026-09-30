import { useState , useEffect } from 'react';

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [targetScanned, setTargetScanned] = useState(0);
  const [displayScanned, setDisplayScanned] = useState(0);
  const [liveDuplicates, setLiveDuplicates] = useState(0);


  // Smooth counter effect: rapidly increments displayScanned until it catches up to targetScanned
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (loading && displayScanned < targetScanned) {
      interval = setInterval(() => {
        setDisplayScanned(prev => {
          const diff = targetScanned - prev;
          if (diff <= 0) return targetScanned;
          const increment = Math.max(1, Math.ceil(diff / 8)); 
          return prev + increment;
        });
      }, 30);
    }
    
    return () => clearInterval(interval);
  }, [displayScanned, targetScanned, loading]);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000); // נעלם אחרי 4 שניות
  };

  const handleScan = () => {
      setLoading(true);
      setError('');
      setTargetScanned(0);
      setDisplayScanned(0);
      setLiveDuplicates(0);
      setDuplicateGroups([]);

      const eventSource = new EventSource(`${API}/api/drive/scan`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          setTargetScanned(data.scannedCount);
          setLiveDuplicates(data.duplicatesCount);
        } 
        else if (data.type === 'complete') {
          setDuplicateGroups(data.duplicateGroups);
          setTargetScanned(data.totalScanned);
          setDisplayScanned(data.totalScanned);
          setLoading(false);
          eventSource.close();
        } 
        else if (data.type === 'error') {
          setError(data.message);
          setLoading(false);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setError('Network error: Connection lost during scan.');
        setLoading(false);
        eventSource.close();
      };
    };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-right" dir="rtl">
      {toastMessage && (
      <div className="fixed bottom-6 left-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 transition-all flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        <span className="font-medium">{toastMessage}</span>
      </div>
     )}
      <div className="max-w-7xl mx-auto">

        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">סורק הכפילויות בדרייב</h1>
            <div className="mt-2">
              {loading ? (
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
              ) : (
                <p className="text-gray-500">
                  {displayScanned > 0 
                    ? `נסרקו ${displayScanned} קבצים. נמצאו ${duplicateGroups.length} סטים כפולים.` 
                    : 'מצא תמונות וסרטונים כפולים שמבזבזים לך מקום'}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all font-medium disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? (
              <>
                {/* Spinner Animation */}
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                סורק את כל הקבצים בכונן...
              </>
            ) : (
              'התחל סריקה'
            )}
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

                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`${API}/api/drive/file/${file.id}`, {
                                  method: 'DELETE',
                                });
                                const data = await res.json();
                                
                                if (data.success) {
                                  // Update the state to remove the deleted file from the duplicate groups
                                  setToastMessage(`הקובץ ${file.name} נמחק בהצלחה`);
                                  setDuplicateGroups(prevGroups => 
                                    prevGroups.map(groupObj => ({
                                      ...groupObj,
                                      files: groupObj.files.filter(f => f.id !== file.id)
                                    })).filter(groupObj => groupObj.files.length > 1) // מסיר סט כפילויות אם נשאר בו רק קובץ אחד
                                  );
                                } else {
                                  alert('שגיאה במחיקת הקובץ');
                                }
                              } catch (err) {
                                alert('שגיאת תקשורת מול השרת');
                              }
                            }}
                            className="mt-auto w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100"
                          >
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