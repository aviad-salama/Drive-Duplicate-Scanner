import type { CloudAccount } from '../types/cloud';
import { formatBytes } from '../utils/format';
import { providerLabel } from '../config/providers';
import { he } from '../languages/he';
import { Badge } from './ui/badge';
import PriorityMoveButtons from './PriorityMoveButtons';

interface Props {
  account: CloudAccount;
  index: number;
  itemCount: number;
  savedBytes: number;
  movePriority: (index: number, direction: 'up' | 'down') => void;
}

export default function PriorityAccountRow({
  account,
  index,
  itemCount,
  savedBytes,
  movePriority,
}: Props) {
  return (
    <div className="priority-row">
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {index + 1}. {providerLabel(account.provider)}{' '}
        <span className="opacity-75">({account.accountEmail})</span>
        <Badge variant="success" className="mr-6">
          {he.priority.spacePotential(formatBytes(savedBytes.toString()))}
        </Badge>
      </span>
      <PriorityMoveButtons
        index={index}
        itemCount={itemCount}
        movePriority={movePriority}
      />
    </div>
  );
}
