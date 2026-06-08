import clsx from 'clsx';
import {
  BadgeCheck,
  Crown,
  Gift,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Swords,
  Trophy,
  Users,
  X
} from 'lucide-react';
import { useState } from 'react';

export const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'lobby', label: 'Lobby', icon: Swords },
  { id: 'table', label: 'Table', icon: Crown },
  { id: 'missions', label: 'Missions', icon: Gift },
  { id: 'leaderboards', label: 'Ranks', icon: Trophy },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'battlepass', label: 'Pass', icon: Star },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'profile', label: 'Profile', icon: BadgeCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin', label: 'Admin', icon: Shield }
];

export function NavBar({ activeView, setActiveView, profile, connected, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/[0.82] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button type="button" className="icon-btn md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Open navigation">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <button type="button" onClick={() => setActiveView('home')} className="flex min-w-0 items-center gap-3">
          <img src="/assets/chip.svg" alt="" className="h-10 w-10" />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-black uppercase text-brass">AAA Blackjack</p>
            <p className="text-xs text-white/50">Social casino arena</p>
          </div>
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navItems.slice(0, 8).map((item) => (
            <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => setActiveView(item.id)} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 sm:flex">
            <span className={clsx('h-2.5 w-2.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-ruby')} />
            <span className="text-xs font-semibold text-white/65">{connected ? 'Online' : 'Offline'}</span>
          </div>
          <button type="button" className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left sm:flex" onClick={() => setActiveView('profile')}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brass text-sm font-black text-ink">
              {profile?.username?.[0]?.toUpperCase() ?? 'P'}
            </span>
            <span className="max-w-32 truncate text-sm font-semibold">{profile?.username}</span>
          </button>
          <button type="button" className="icon-btn" onClick={() => setActiveView('chat')} aria-label="Open chat" title="Chat">
            <MessageCircle className="h-5 w-5" />
          </button>
          <button type="button" className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-ink px-4 py-3 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeView === item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'btn min-h-10 px-3 text-xs',
        active ? 'bg-brass text-ink' : 'bg-transparent text-white/[0.62] hover:bg-white/10 hover:text-ivory'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </button>
  );
}
