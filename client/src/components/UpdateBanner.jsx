import { Download, RefreshCw } from 'lucide-react';

export function UpdateBanner({ updateInfo, onReload }) {
  if (!updateInfo) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-md border border-brass/35 bg-ink/95 p-4 shadow-table backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 text-brass" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ivory">New version ready</p>
          <p className="mt-1 text-sm text-white/[0.62]">Finish this hand, then update for the latest build.</p>
        </div>
        <button type="button" className="btn btn-primary min-h-10 px-3" onClick={onReload}>
          <RefreshCw className="h-4 w-4" />
          Update
        </button>
      </div>
    </div>
  );
}
