import { useState , useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  md5Checksum?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

interface DuplicateGroup {
  type: 'exact' | 'quality';
  files: DriveFile[];
}

const formatBytes = (bytes?: string) => {
  if (!bytes) return 'N/A';
  return (parseInt(bytes) / (1024 * 1024)).toFixed(2) + ' MB';
};

// ==========================================
// User's custom MediaPreview component
// ==========================================
function MediaPreview({ file, isVideo }: { file: DriveFile; isVideo: boolean }) {
  const sources: { type: 'img' | 'video'; src: string }[] = [];

  // if (file.thumbnailLink) {
  //   sources.push({
  //     type: 'img',
  //     src: file.thumbnailLink.replace(/=s\d+$/, '=s600'),
  //   });
  // }

  sources.push({
    type: 'img',
    src: `${API}/api/drive/thumbnail/${file.id}`,
  });

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
      crossOrigin="use-credentials" // חובה כדי שהעוגיות יישלחו לתמונה המוגנת
      onError={next}
    />
  ) : (
    <video
      src={current.src}
      className="w-full h-full object-cover"
      preload="metadata"
      muted
      playsInline
      crossOrigin="use-credentials" // חובה כדי שהעוגיות יישלחו לסרטון המוגן
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [targetScanned, setTargetScanned] = useState(0);
  const [displayScanned, setDisplayScanned] = useState(0);
  const [liveDuplicates, setLiveDuplicates] = useState(0);

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
    }, 4000); 
  };

  const handleScan = () => {
      setLoading(true);
      setError('');
      setTargetScanned(0);
      setDisplayScanned(0);
      setLiveDuplicates(0);
      setDuplicateGroups([]);

      // הוספת withCredentials מאפשרת שליחת ה-Cookies לשרת
      const eventSource = new EventSource(`${API}/api/drive/scan`, {
        withCredentials: true 
      });

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
        // אם החיבור נכשל מיד, סביר להניח שאין עוגיית התחברות (401 Unauthorized)
        setError('שגיאת חיבור! אנא ודא שהתחברת למערכת באמצעות כפתור ההתחברות למעלה.');
        setLoading(false);
        eventSource.close();
      };
    };

    // Handle bulk deletion of duplicate files
    const handleBulkDelete = async () => {
      const filesToDelete = duplicateGroups.flatMap(groupObj => groupObj.files.slice(1));
      
      if (filesToDelete.length === 0) return;
      
      const confirmMessage = `Are you sure you want to delete ${filesToDelete.length} duplicate files? This action cannot be undone.`;
      if (!window.confirm(confirmMessage)) return;

      setLoading(true);
      let successCount = 0;
      let failedCount = 0;

      for (const file of filesToDelete) {
        try {
          const res = await fetch(`${API}/api/drive/file/${file.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (res.ok) {
            successCount++;
            setDuplicateGroups(prevGroups => 
              prevGroups.map(groupObj => ({
                ...groupObj,
                files: groupObj.files.filter(f => f.id !== file.id)
              })).filter(groupObj => groupObj.files.length > 1) 
            );
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
        }
      }
      
      setLoading(false);
      showToast(`Deleted ${successCount} files successfully.${failedCount > 0 ? ` Failed to delete ${failedCount} files.` : ''}`);
    };

  const duplicateFilesCount = duplicateGroups.reduce((acc, group) => acc + (group.files.length - 1), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-right" dir="rtl">
      {toastMessage && (
      <div className="fixed bottom-6 left-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 transition-all flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        <span className="font-medium">{toastMessage}</span>
      </div>
     )}
      <div className="max-w-7xl mx-auto">

        {/* --- הדר (Header) חדש עם כפתור התחברות --- */}
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-wrap gap-4">
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

          <div className="flex items-center gap-4">
            <a
              href={`${API}/auth/google`}
              className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition-all font-medium text-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              התחבר עם גוגל
            </a>

            <button
              onClick={handleScan}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all font-medium disabled:opacity-50 flex items-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  סורק את כל הקבצים...
                </>
              ) : (
                'התחל סריקה'
              )}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {/*  Conditional rendering for bulk delete button */}
          {duplicateGroups.length > 0 && duplicateFilesCount > 0 && (
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">פעולות מהירות</h3>
                <p className="text-sm text-gray-500">נמצאו {duplicateFilesCount} קבצים כפולים שניתן למחוק בבת אחת.</p>
              </div>
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-red-700 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                מחק הכל ({duplicateFilesCount} קבצים)
              </button>
            </div>
          )}

          {/* Render duplicate groups */}
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
                          <MediaPreview file={file} isVideo={isVideo} />
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
                                // הוספנו credentials: 'include' כדי לשלוח את העוגיות לשרת במחיקה
                                const res = await fetch(`${API}/api/drive/file/${file.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include' 
                                });
                                
                                if (res.status === 401) {
                                  alert('שגיאת אבטחה: אנא התחבר מחדש לגוגל.');
                                  return;
                                }

                                const data = await res.json();
                                
                                if (data.success) {
                                  showToast(`הקובץ ${file.name} נמחק בהצלחה`);
                                  setDuplicateGroups(prevGroups => 
                                    prevGroups.map(groupObj => ({
                                      ...groupObj,
                                      files: groupObj.files.filter(f => f.id !== file.id)
                                    })).filter(groupObj => groupObj.files.length > 1) 
                                  );
                                } else {
                                  alert('שגיאה במחיקת הקובץ: ' + (data.message || ''));
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