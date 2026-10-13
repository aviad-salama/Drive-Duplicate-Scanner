import type { CloudAccount } from '../types/cloud';
import { formatBytes } from '../utils/format';
import { providerLabel } from '../config/providers';
import { Card } from './ui/Card';
import { Title, Text } from './ui/Typography';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { he } from '../languages/he';

interface Props {
  priorityOrder: string[];
  accounts: CloudAccount[];
  savings: Record<string, number>;
  movePriority: (index: number, direction: 'up' | 'down') => void;
}

export default function PrioritySettingsBoard({ priorityOrder, accounts, savings, movePriority }: Props) {
  if (priorityOrder.length <= 1) {
    return null;
  }

  return (
    <Card className="mb-8 bg-white/90 dark:bg-slate-900/90 border-orange-200 dark:border-orange-900/50">
      <Title level={3} className="mb-4 text-lg text-orange-800 dark:text-orange-300">
        {he.priority.title}
      </Title>
      <Text size="sm" className="mb-4 text-gray-600 dark:text-slate-400">
        {he.priority.description}
      </Text>
      <div className="flex flex-col gap-3">
        {priorityOrder.map((id, index) => {
          const acc = accounts.find((a) => a.id === id);
          if (!acc) {
            return null;
          }
          const savedBytes = savings[id] || 0;
          return (
            <div key={id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {index + 1}. {providerLabel(acc.provider)} <span className="opacity-75">({acc.accountEmail})</span>
                <Badge variant="success" className="mr-6">
                  {he.priority.spacePotential(formatBytes(savedBytes.toString()))}
                </Badge>
              </span>
              <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => movePriority(index, 'up')}
                  className="rounded-none p-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 dark:text-slate-300"
                  title={he.priority.moveUp}
                >
                  ▲
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={index === priorityOrder.length - 1}
                  onClick={() => movePriority(index, 'down')}
                  className="rounded-none p-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 dark:text-slate-300"
                  title={he.priority.moveDown}
                >
                  ▼
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}