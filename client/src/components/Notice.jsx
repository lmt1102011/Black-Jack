import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export function Notice({ notice, onClose }) {
  return (
    <AnimatePresence>
      {notice ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-md border border-white/10 bg-ink/95 p-4 shadow-table"
        >
          {notice.type === 'error' ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 text-ruby" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-brass" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{notice.title ?? (notice.type === 'error' ? 'Action blocked' : 'Ready')}</p>
            <p className="mt-1 text-sm text-white/65">{notice.message}</p>
          </div>
          <button type="button" className="icon-btn h-8 w-8" onClick={onClose} aria-label="Close notice">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
