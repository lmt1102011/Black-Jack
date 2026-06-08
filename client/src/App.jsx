import { Suspense, lazy, useEffect, useState } from 'react';
import { TABLE_PHASES } from '@blackjack/shared';
import { Notice } from './components/Notice.jsx';
import { NavBar } from './components/NavBar.jsx';
import { UpdateBanner } from './components/UpdateBanner.jsx';
import { useAutoUpdate } from './hooks/useAutoUpdate.js';
import { useAuth } from './hooks/useAuth.js';
import { useSocket } from './hooks/useSocket.js';
import { AuthScreen } from './views/AuthScreen.jsx';
import { HomeView } from './views/HomeView.jsx';
import { LobbyView } from './views/LobbyView.jsx';
import { TableView } from './views/TableView.jsx';
import { assets } from './lib/assets.js';

const MissionsView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.MissionsView })));
const LeaderboardsView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.LeaderboardsView })));
const FriendsView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.FriendsView })));
const ShopView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.ShopView })));
const BattlePassView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.BattlePassView })));
const ProfileView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.ProfileView })));
const SettingsView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.SettingsView })));
const AdminView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.AdminView })));
const ChatView = lazy(() => import('./views/MetaViews.jsx').then((module) => ({ default: module.ChatView })));

export default function App() {
  const auth = useAuth();
  const socket = useSocket(auth.profile, auth.getToken);
  const [activeView, setActiveView] = useState('home');
  const inActiveRound = socket.table?.phase === TABLE_PHASES.playing || socket.table?.phase === TABLE_PHASES.dealer;
  const autoUpdate = useAutoUpdate({ canReloadAutomatically: !inActiveRound });

  useEffect(() => {
    if (socket.table && ['home', 'lobby'].includes(activeView)) {
      setActiveView('table');
    }
  }, [activeView, socket.table]);

  if (auth.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="surface rounded-md p-8 text-center">
          <img src={assets.chip} alt="" className="mx-auto h-16 w-16 animate-pulse" />
          <p className="mt-4 font-black">Loading casino</p>
        </div>
      </main>
    );
  }

  if (!auth.profile) {
    return <AuthScreen auth={auth} />;
  }

  function quickMatch() {
    socket.actions.quickMatch();
    setActiveView('table');
  }

  const tableMode = activeView === 'table';
  const mainClass = tableMode
    ? 'mx-auto h-full w-full max-w-[1600px] px-2 py-2 sm:px-3'
    : 'mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7';

  return (
    <div className={tableMode ? 'h-screen overflow-hidden' : 'min-h-screen'}>
      {!tableMode ? (
        <NavBar
          activeView={activeView}
          setActiveView={setActiveView}
          profile={auth.profile}
          connected={socket.connected}
          onLogout={auth.logout}
        />
      ) : null}

      <main className={mainClass}>
        <Suspense fallback={<ViewFallback />}>
          {activeView === 'home' ? (
            <HomeView profile={auth.profile} table={socket.table} lobby={socket.lobby} onPlay={quickMatch} setActiveView={setActiveView} />
          ) : null}
          {activeView === 'lobby' ? (
            <LobbyView lobby={socket.lobby} connected={socket.connected} actions={socket.actions} openTable={quickMatch} />
          ) : null}
          {activeView === 'table' ? (
            <TableView table={socket.table} profile={auth.profile} connected={socket.connected} actions={socket.actions} goLobby={() => setActiveView('lobby')} />
          ) : null}
          {activeView === 'missions' ? <MissionsView /> : null}
          {activeView === 'leaderboards' ? <LeaderboardsView /> : null}
          {activeView === 'friends' ? <FriendsView /> : null}
          {activeView === 'shop' ? <ShopView /> : null}
          {activeView === 'battlepass' ? <BattlePassView /> : null}
          {activeView === 'profile' ? <ProfileView profile={auth.profile} table={socket.table} /> : null}
          {activeView === 'settings' ? <SettingsView /> : null}
          {activeView === 'admin' ? <AdminView /> : null}
          {activeView === 'chat' ? <ChatView table={socket.table} profile={auth.profile} /> : null}
        </Suspense>
      </main>

      <Notice notice={socket.notice} onClose={socket.clearNotice} />
      <UpdateBanner updateInfo={autoUpdate.updateInfo} onReload={autoUpdate.reloadNow} />
    </div>
  );
}

function ViewFallback() {
  return (
    <div className="surface rounded-md p-6 text-sm font-semibold text-white/60">
      Loading view
    </div>
  );
}
