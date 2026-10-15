import { CheckIcon } from './icons';
import { Alert } from './ui/Alert';

export default function Toast({ message }: { message: string }) {
  return (
    <Alert variant="success" className="toast">
      <CheckIcon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </Alert>
  );
}
