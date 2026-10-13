import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BulkDeleteBar from '../../components/BulkDeleteBar';
import DuplicateGroupCard from '../../components/DuplicateGroupCard';
import ScanControls from '../../components/ScanControls';
import ScanStatus from '../../components/ScanStatus';
import Toast from '../../components/Toast';
import PrioritySettingsBoard from '../../components/PrioritySettingsBoard';
import { PROVIDERS, providerLabel } from '../../config/providers';
import { useAuth } from '../../hooks/useAuth';
import { useCloudAccounts } from '../../hooks/useCloudAccounts';
import { useScan } from '../../hooks/useScan';
import { usePriorityManager } from '../../hooks/usePriorityManager';
import { connectUrl } from '../../services/cloudService';
import type { CloudFile } from '../../types/cloud';
import { ScanAllIcon } from '../../components/icons';

const secondaryBtn =
  'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 px-4 py-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { accounts, loading: accountsLoading, disconnect, isDisconnecting } = useCloudAccounts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [params] = useSearchParams();
  
  const scan = useScan();
  const priorityManager = usePriorityManager(accounts, scan.groups);

  const activeId = selectedId ?? accounts[0]?.id ?? null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteOne = async (file: CloudFile) => {
    const ok = await scan.deleteFile(file);
    showToast(ok ? `הקובץ ${file.name} הועבר לאשפה` : 'שגיאה במחיקת הקובץ');
  };

  const handleBulkDelete = async () => {
    const filesToDelete = priorityManager.getFilesToDelete();
    if (!window.confirm(`להעביר לאשפה ${filesToDelete.length} קבצים כפולים לפי התעדוף שהגדרת?`)) return;
    
    const { success, failed } = await scan.deleteDuplicates(filesToDelete);
    showToast(`הועברו לאשפה ${success} קבצים.${failed > 0 ? ` נכשלו ${failed}.` : ''}`);
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
                <ScanAllIcon className="w-5 h-5" />
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

        {scan.duplicateFilesCount > 0 && accounts.length > 1 && (
          <PrioritySettingsBoard 
            priorityOrder={priorityManager.priorityOrder}
            accounts={accounts}
            savings={priorityManager.savings}
            movePriority={priorityManager.movePriority}
          />
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
            const keepFile = priorityManager.getKeepFile(group.files);
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