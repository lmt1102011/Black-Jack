import clsx from 'clsx';
import {
  BadgeCheck,
  Crown,
  Gift,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
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

const primaryItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'lobby', label: 'Lobby', icon: Swords },
  { id: 'table', label: 'Table', icon: Crown }
];

const secondaryItems = [
  { id: 'profile', label: 'Profile', icon: BadgeCheck },
  { id: 'missions', label: 'Missions', icon: Gift },
  { id: 'leaderboards', label: 'Ranks', icon: Trophy },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'battlepass', label: 'Pass', icon: Star },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin', label: 'Admin', icon: Shield }
];

export const navItems = [...primaryItems, ...secondaryItems];

export function NavBar({ activeView, setActiveView, profile, connected, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = secondaryItems.some((item) => item.id === activeView);

  function chooseView(view) {
    setActiveView(view);
    setMobileOpen(false);
    setMoreOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/[0.86] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button type="button" className="icon-btn md:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Open navigation">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <button type="button" onClick={() => chooseView('home')} className="flex min-w-0 items-center gap-3">
          <img src="/assets/chip.svg" alt="" className="h-10 w-10" />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-black uppercase text-brass">AAA Blackjack</p>
            <p className="text-xs text-white/50">Play table first</p>
          </div>
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {primaryItems.map((item) => (
            <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => chooseView(item.id)} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 sm:flex">
            <span className={clsx('h-2.5 w-2.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-ruby')} />
            <span className="text-xs font-semibold text-white/65">{connected ? 'Online' : 'Offline'}</span>
          </div>

          <button type="button" className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left sm:flex" onClick={() => chooseView('profile')}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brass text-sm font-black text-ink">
              {profile?.username?.[0]?.toUpperCase() ?? 'P'}
            </span>
            <span className="max-w-32 truncate text-sm font-semibold">{profile?.username}</span>
          </button>

          <div className="relative hidden md:block">
            <button
              type="button"
              className={clsx('btn min-h-10 px-3 text-xs', moreActive ? 'bg-brass text-ink' : 'bg-white/5 text-white/70 hover:bg-white/10')}
              onClick={() => setMoreOpen((value) => !value)}
            >
              <MoreHorizontal className="h-4 w-4" />
              More
            </button>

            {moreOpen ? (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-white/10 bg-ink p-2 shadow-table">
                {secondaryItems.map((item) => (
                  <MenuButton key={item.id} item={item} active={activeView === item.id} onClick={() => chooseView(item.id)} />
                ))}
              </div>
            ) : null}
          </div>

          <button type="button" className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-ink px-4 py-3 md:hidden">
          <div className="grid grid-cols-3 gap-2">
            {primaryItems.map((item) => (
              <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => chooseView(item.id)} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {secondaryItems.map((item) => (
              <MenuButton key={item.id} item={item} active={activeView === item.id} onClick={() => chooseView(item.id)} />
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
        active ? 'bg-brass text-ink' : 'bg-transparent text-white/[0.66] hover:bg-white/10 hover:text-ivory'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </button>
  );
}

function MenuButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition',
        active ? 'bg-brass text-ink' : 'text-white/70 hover:bg-white/10 hover:text-ivory'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </button>
  );
}
