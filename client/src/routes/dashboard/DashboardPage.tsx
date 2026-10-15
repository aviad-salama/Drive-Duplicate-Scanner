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
import { Card } from '../../components/ui/Card';
import { Title, Text } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { he } from '../../languages/he';

const secondaryLink = 'inline-flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const {
    accounts, loading: accountsLoading, disconnect, isDisconnecting,
  } = useCloudAccounts();
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
    showToast(ok ? he.errors.deleteSuccess(file.name) : he.errors.deleteFile);
  };

  const handleBulkDelete = async () => {
    const filesToDelete = priorityManager.getFilesToDelete();
    if (!window.confirm(he.actions.confirmBulkDelete(filesToDelete.length))) {
      return;
    }

    const { success, failed } = await scan.deleteDuplicates(filesToDelete);
    const failedMessage = failed > 0 ? he.scan.failedItems(failed) : '';
    showToast(he.scan.bulkDeleteSuccess(success, failedMessage));
  };

  const error = scan.error || (params.get('error') ? he.errors.cloudConnection : '');

  return (
    <div className="min-h-screen bg-transparent p-8 text-right" dir="rtl">
      {toast && <Toast message={toast} />}
      <div className="max-w-7xl mx-auto">

        <Card className="dashboard-panel">
          <div className="min-w-0 lg:flex-1">
            <Title level={1} className="text-3xl text-gray-800 dark:text-white">{he.dashboard.title}</Title>
            <Text size="sm" variant="dimmed" className="mt-1">{he.dashboard.greeting(user?.name)}</Text>
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
                  className="account-select"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {providerLabel(a.provider)} – {a.accountEmail}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="md"
                  className="font-medium"
                  disabled={scan.scanning || isDisconnecting}
                  onClick={async () => {
                    if (!activeId) {
                      return;
                    }
                    await disconnect(activeId);
                    setSelectedId(null);
                    scan.reset();
                  }}
                >
                  {isDisconnecting ? he.dashboard.disconnecting : he.dashboard.disconnect}
                </Button>
              </>
            )}

            {PROVIDERS.map((p) => (
              <a key={p.id} href={connectUrl(p.id)} className={secondaryLink}>
                {he.dashboard.connectProvider(p.label)}
              </a>
            ))}

            {accounts.length >= 2 && (
              <Button
                variant="warning"
                size="md"
                onClick={scan.startScanAll}
                disabled={scan.scanning}
                className="bg-orange-500 shadow-md shadow-orange-600/20 hover:bg-orange-600"
              >
                <ScanAllIcon className="w-5 h-5" />
                {scan.scanning && scan.mode === 'all' ? he.scan.scanning : he.scan.scanAll}
              </Button>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={() => activeId && scan.startScan(activeId)}
              disabled={!activeId || scan.scanning}
            >
              {scan.scanning && scan.mode === 'single' ? he.scan.scanning : he.scan.start}
            </Button>
            <Button variant="secondary" onClick={logout}>{he.dashboard.logout}</Button>
          </div>
        </Card>

        {error && (
          <Alert variant="error" className="mb-6 font-medium">
            {error}
          </Alert>
        )}

        {!accountsLoading && accounts.length === 0 && (
          <Card padding="lg" className="text-center text-gray-500 dark:text-slate-400">
            {he.dashboard.noAccounts}
          </Card>
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
