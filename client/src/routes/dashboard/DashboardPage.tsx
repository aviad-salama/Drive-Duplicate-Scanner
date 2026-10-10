import { useState } from 'react';
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

const secondaryBtn =
  'bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { accounts, loading: accountsLoading, disconnect, isDisconnecting } = useCloudAccounts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [params] = useSearchParams();
  const scan = useScan();
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
    if (!window.confirm(`להעביר לאשפה ${scan.duplicateFilesCount} קבצים כפולים?`)) return;
    const { success, failed } = await scan.deleteDuplicates();
    showToast(`הועברו לאשפה ${success} קבצים.${failed > 0 ? ` נכשלו ${failed}.` : ''}`);
  };

  const error = scan.error || (params.get('error') ? 'חיבור הענן נכשל, נסה שוב.' : '');

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-right" dir="rtl">
      {toast && <Toast message={toast} />}
      <div className="max-w-7xl mx-auto">
        {/* The title block is always the first child, so it never moves. */}
        <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <h1 className="text-3xl font-bold text-gray-800">סורק הכפילויות</h1>
            <p className="text-sm text-gray-500 mt-1">שלום {user?.name}</p>
            <div className="mt-2">
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
                  className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
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
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7l8-4 8 4M4 7l8 4 8-4" />
                </svg>
                {scan.scanning && scan.mode === 'all' ? 'סורק את כל הדרייבים...' : 'סרוק את כל הדרייבים'}
              </button>
            )}

            <button
              onClick={() => activeId && scan.startScan(activeId)}
              disabled={!activeId || scan.scanning}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {scan.scanning && scan.mode === 'single' ? 'סורק...' : 'התחל סריקה'}
            </button>
            <button onClick={logout} className={secondaryBtn}>התנתק</button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-medium">
            {error}
          </div>
        )}

        {!accountsLoading && accounts.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
            חבר ענן כדי להתחיל לסרוק כפילויות.
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
          {scan.groups.map((group, i) => (
            <DuplicateGroupCard
              key={`${group.files[0]?.accountId ?? ''}:${group.files[0]?.id ?? i}`}
              group={group}
              index={i}
              accountId={activeId ?? ''}
              onDelete={handleDeleteOne}
            />
          ))}
        </div>
      </div>
    </div>
  );
}