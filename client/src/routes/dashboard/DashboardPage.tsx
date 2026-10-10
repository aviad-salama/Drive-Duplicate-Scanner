import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import BulkDeleteBar from '../../components/BulkDeleteBar';
import DuplicateGroupCard from '../../components/DuplicateGroupCard';
import ScanControls from '../../components/ScanControls';
import ScanStatus from '../../components/ScanStatus';
import Toast from '../../components/Toast';
import { PROVIDERS, providerLabel } from '../../config/providers';
import { useAuth } from '../../hooks/useAuth';
import { useCloudAccounts } from '../../hooks/useCloudAccounts';
import { useScan } from '../../hooks/useScan';
import { connectUrl } from '../../services/cloudService';
import type { CloudFile } from '../../types/cloud';
import { formatBytes } from '../../utils/format';

const secondaryBtn =
  'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 px-4 py-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { accounts, loading: accountsLoading, disconnect, isDisconnecting } = useCloudAccounts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [params] = useSearchParams();
  const scan = useScan();

  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);

  // Initialize or update priority array when accounts change
  useEffect(() => {
    const accountIds = accounts.map((a) => a.id);
    setPriorityOrder((prev) => {
      const current = prev.filter((id) => accountIds.includes(id));
      const newIds = accountIds.filter((id) => !current.includes(id));
      return [...current, ...newIds];
    });
  }, [accounts]);

  const activeId = selectedId ?? accounts[0]?.id ?? null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteOne = async (file: CloudFile) => {
    const ok = await scan.deleteFile(file);
    showToast(ok ? `הקובץ ${file.name} הועבר לאשפה` : 'שגיאה במחיקת הקובץ');
  };

  // Logic to determine which file to keep in a group, based on Priority
  const getKeepFile = (groupFiles: CloudFile[]) => {
    let keepFile = groupFiles[0];
    let bestPriority = Infinity;

    groupFiles.forEach((file) => {
      if (!file.accountId) return;
      const prioIndex = priorityOrder.indexOf(file.accountId);
      if (prioIndex !== -1 && prioIndex < bestPriority) {
        bestPriority = prioIndex;
        keepFile = file;
      }
    });
    return keepFile;
  };

  // Calculate savings per account dynamically
  const savings = useMemo(() => {
    const calc: Record<string, number> = {};
    accounts.forEach((a) => (calc[a.id] = 0));

    scan.groups.forEach((group) => {
      const keepFile = getKeepFile(group.files);
      group.files.forEach((file) => {
        if (file !== keepFile && file.accountId && file.size) {
          calc[file.accountId] = (calc[file.accountId] || 0) + parseInt(file.size, 10);
        }
      });
    });
    return calc;
  }, [scan.groups, priorityOrder, accounts]);

  const handleBulkDelete = async () => {
    // Generate an array of files to delete based on the exact current priority
    const filesToDelete = scan.groups.flatMap((group) => {
      const keepFile = getKeepFile(group.files);
      return group.files.filter((f) => f !== keepFile);
    });

    if (!window.confirm(`להעביר לאשפה ${filesToDelete.length} קבצים כפולים לפי התעדוף שהגדרת?`)) return;
    const { success, failed } = await scan.deleteDuplicates(filesToDelete);
    showToast(`הועברו לאשפה ${success} קבצים.${failed > 0 ? ` נכשלו ${failed}.` : ''}`);
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...priorityOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setPriorityOrder(newOrder);
  };

  const error = scan.error || (params.get('error') ? 'חיבור הענן נכשל, נסה שוב.' : '');

  return (
    <div className="min-h-screen bg-transparent p-8 text-right" dir="rtl">
      {toast && <Toast message={toast} />}
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg shadow-teal-950/5 dark:shadow-black/10 border border-gray-200 dark:border-slate-700 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between transition-colors">
          <div className="min-w-0 lg:flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">סורק הכפילויות</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">שלום {user?.name}</p>
            <div className="mt-2 text-gray-800 dark:text-slate-300">
              <ScanStatus
                scanning={scan.scanning}
                paused={scan.paused}
                cancelled={scan.cancelled}
                displayScanned={scan.displayScanned}
                liveDuplicates={scan.liveDuplicates}
                groupsCount={scan.groups.length}
                currentAccount={scan.currentAccount}
              />
            </div>
            {scan.scanning && (
              <ScanControls
                paused={scan.paused}
                onPause={scan.pause}
                onResume={scan.resume}
                onCancel={scan.cancel}
              />
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap lg:justify-end lg:max-w-[60%]">
            {accounts.length > 0 && (
              <>
                <select
                  value={activeId ?? ''}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    scan.reset();
                  }}
                  className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {providerLabel(a.provider)} – {a.accountEmail}
                    </option>
                  ))}
                </select>
                <button
                  className={secondaryBtn}
                  disabled={scan.scanning || isDisconnecting}
                  onClick={async () => {
                    if (!activeId) return;
                    await disconnect(activeId);
                    setSelectedId(null);
                    scan.reset();
                  }}
                >
                  {isDisconnecting ? 'מנתק...' : 'נתק'}
                </button>
              </>
            )}

            {PROVIDERS.map((p) => (
              <a key={p.id} href={connectUrl(p.id)} className={secondaryBtn}>
                חבר {p.label}
              </a>
            ))}

            {accounts.length >= 2 && (
              <button
                onClick={scan.startScanAll}
                disabled={scan.scanning}
                className="bg-orange-500 text-white px-5 py-2.5 rounded-xl shadow-md shadow-orange-600/20 hover:bg-orange-600 font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7l8-4 8 4M4 7l8 4 8-4" />
                </svg>
                {scan.scanning && scan.mode === 'all' ? 'סורק...' : 'סרוק הכל'}
              </button>
            )}

            <button
              onClick={() => activeId && scan.startScan(activeId)}
              disabled={!activeId || scan.scanning}
              className="bg-teal-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 font-semibold disabled:opacity-50 transition-colors"
            >
              {scan.scanning && scan.mode === 'single' ? 'סורק...' : 'התחל סריקה'}
            </button>
            <button onClick={logout} className={secondaryBtn}>התנתק</button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 border border-red-100 dark:border-red-900/50 font-medium">
            {error}
          </div>
        )}

        {!accountsLoading && accounts.length === 0 && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 text-center text-gray-500 dark:text-slate-400">
            חבר ענן כדי להתחיל לסרוק כפילויות.
          </div>
        )}

        {/* Priority & Savings UI */}
        {scan.duplicateFilesCount > 0 && accounts.length > 1 && (
          <div className="mb-8 bg-white/90 dark:bg-slate-900/90 p-6 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900/50">
            <h3 className="font-bold text-lg text-orange-800 dark:text-orange-300 mb-4">
              תעדוף כוננים לשמירת קבצים מרובים
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              קבע איזה דרייב יקבל עדיפות. כשימצא קובץ כפול, המערכת תשמור אותו בדרייב שנמצא גבוה יותר ברשימה זו, ותמחק אותו מהשאר (על פי החישוב הזה, כך יראה החיסכון הכולל שלך).
            </p>
            <div className="flex flex-col gap-3">
              {priorityOrder.map((id, index) => {
                const acc = accounts.find((a) => a.id === id);
                if (!acc) return null;
                const savedBytes = savings[id] || 0;
                return (
                  <div key={id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {index + 1}. {providerLabel(acc.provider)} <span className="opacity-75">({acc.accountEmail})</span>
                      <span className="mr-6 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                        פוטנציאל פינוי מקום: {formatBytes(savedBytes.toString())}
                      </span>
                    </span>
                    <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <button
                        disabled={index === 0}
                        onClick={() => movePriority(index, 'up')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 dark:text-slate-300"
                        title="הזז למעלה"
                      >
                        ▲
                      </button>
                      <button
                        disabled={index === priorityOrder.length - 1}
                        onClick={() => movePriority(index, 'down')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 dark:text-slate-300"
                        title="הזז למטה"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {scan.duplicateFilesCount > 0 && (
            <BulkDeleteBar
              count={scan.duplicateFilesCount}
              disabled={scan.scanning || scan.deleting}
              onClick={handleBulkDelete}
            />
          )}
          {scan.groups.map((group, i) => {
            const keepFile = getKeepFile(group.files);
            return (
              <DuplicateGroupCard
                key={`${group.files[0]?.accountId ?? ''}:${group.files[0]?.id ?? i}`}
                group={group}
                index={i}
                accountId={activeId ?? ''}
                onDelete={handleDeleteOne}
                keepFileId={keepFile.id}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}