export function StatPill({ label, value, icon: Icon }) {
  return (
    <div className="surface-soft flex min-h-16 items-center gap-3 rounded-md px-4 py-3">
      {Icon ? <Icon className="h-5 w-5 text-brass" /> : null}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-white/45">{label}</p>
        <p className="truncate text-lg font-black text-ivory">{value}</p>
      </div>
    </div>
  );
}
