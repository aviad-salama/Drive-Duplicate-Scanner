import type { CloudAccount } from '../types/cloud';
import { Card } from './ui/Card';
import { Title, Text } from './ui/Typography';
import { he } from '../languages/he';
import PriorityAccountRow from './PriorityAccountRow';

interface Props {
  priorityOrder: string[];
  accounts: CloudAccount[];
  savings: Record<string, number>;
  movePriority: (index: number, direction: 'up' | 'down') => void;
}

export default function PrioritySettingsBoard({
  priorityOrder, accounts, savings, movePriority,
}: Props) {
  if (priorityOrder.length <= 1) {
    return null;
  }

  return (
    <Card className="priority-board">
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
          const savedBytes = savings[id] ?? 0;
          return (
            <PriorityAccountRow
              key={id}
              account={acc}
              index={index}
              itemCount={priorityOrder.length}
              savedBytes={savedBytes}
              movePriority={movePriority}
            />
          );
        })}
      </div>
    </Card>
  );
}
