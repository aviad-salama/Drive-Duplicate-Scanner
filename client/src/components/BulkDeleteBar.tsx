import { TrashIcon } from './icons';
import { Title, Text } from './ui/Typography';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  count: number;
  disabled: boolean;
  onClick: () => void;
}

export default function BulkDeleteBar({ count, disabled, onClick }: Props) {
  return (
    <Card className="flex justify-between items-center flex-wrap gap-4">
      <div>
        <Title level={3}>פעולות מהירות</Title>
        <Text variant="dimmed" size="sm">
          נמצאו {count} קבצים כפולים שניתן להעביר לאשפה בבת אחת.
        </Text>
      </div>
      
      <Button
        variant="danger"
        size="lg"
        onClick={onClick}
        disabled={disabled}
      >
        <TrashIcon className="w-5 h-5" />
        מחק הכל ({count} קבצים)
      </Button>
    </Card>
  );
}