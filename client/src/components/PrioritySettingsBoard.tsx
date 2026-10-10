import type { CloudAccount } from '../types/cloud';
import { formatBytes } from '../utils/format';
import { providerLabel } from '../config/providers';

interface Props {
  priorityOrder: string[];
  accounts: CloudAccount[];
  savings: Record<string, number>;
  movePriority: (index: number, direction: 'up' | 'down') => void;
}

export default function PrioritySettingsBoard({ priorityOrder, accounts, savings, movePriority }: Props) {
  if (priorityOrder.length <= 1) return null;

  return (
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
  );
}