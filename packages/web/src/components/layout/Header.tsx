import { AlertCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-6 py-3">
      <div className="flex items-center gap-2 text-sm text-amber-400">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">Eyyam tamamiyle yasaktır!</span>
      </div>
      <div className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm">
        <span className="text-neutral-400">VP: </span>
        <span className="font-bold text-accent">1,000</span>
      </div>
    </header>
  );
}
