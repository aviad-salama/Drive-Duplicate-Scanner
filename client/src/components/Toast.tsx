import { CheckIcon } from './icons';
import { Alert } from './ui/Alert';

export default function Toast({ message }: { message: string }) {
  return (
    <Alert variant="success" className="fixed bottom-6 left-6 z-50 flex items-center gap-2 border-0 bg-emerald-600 px-6 py-3 text-white shadow-2xl transition-all">
      <CheckIcon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </Alert>
  );
}