import { he } from '../languages/he';
import { Button } from './ui/button';

interface Props {
  index: number;
  itemCount: number;
  movePriority: (index: number, direction: 'up' | 'down') => void;
}

export default function PriorityMoveButtons({ index, itemCount, movePriority }: Props) {
  return (
    <div className="priority-actions">
      <Button
        variant="outline"
        size="sm"
        disabled={index === 0}
        onClick={() => movePriority(index, 'up')}
        className="priority-move-button"
        title={he.priority.moveUp}
      >
        ▲
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={index === itemCount - 1}
        onClick={() => movePriority(index, 'down')}
        className="priority-move-button"
        title={he.priority.moveDown}
      >
        ▼
      </Button>
    </div>
  );
}
