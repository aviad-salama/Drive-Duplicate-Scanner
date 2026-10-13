import { TrashIcon } from './icons';
import { Title, Text } from './ui/Typography';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { he } from '../languages/he';

interface Props {
  count: number;
  disabled: boolean;
  onClick: () => void;
}

export default function BulkDeleteBar({ count, disabled, onClick }: Props) {
  return (
    <Card className="flex justify-between items-center flex-wrap gap-4">
      <div>
        <Title level={3}>{he.actions.quickActions}</Title>
        <Text variant="dimmed" size="sm">
          {he.actions.bulkDeleteDescription(count)}
        </Text>
      </div>
      
      <Button
        variant="danger"
        size="lg"
        onClick={onClick}
        disabled={disabled}
      >
        <TrashIcon className="w-5 h-5" />
        {he.actions.deleteAll(count)}
      </Button>
    </Card>
  );
}