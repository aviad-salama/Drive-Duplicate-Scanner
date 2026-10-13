import { CheckIcon } from './icons';

export default function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 transition-all flex items-center gap-2">
      <CheckIcon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </div>
  );
}