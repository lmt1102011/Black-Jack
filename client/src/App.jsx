import { useEffect, useState } from 'react';
import { Notice } from './components/Notice.jsx';
import { NavBar } from './components/NavBar.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useSocket } from './hooks/useSocket.js';
import { AuthScreen } from './views/AuthScreen.jsx';
import { HomeView } from './views/HomeView.jsx';
import { LobbyView } from './views/LobbyView.jsx';
import {
  AdminView,
  BattlePassView,
  ChatView,
  FriendsView,
  LeaderboardsView,
  MissionsView,
  ProfileView,
  SettingsView,
  ShopView
} from './views/MetaViews.jsx';
import { TableView } from './views/TableView.jsx';

export default function App() {
  const auth = useAuth();
  const socket = useSocket(auth.profile, auth.getToken);
  const [activeView, setActiveView] = useState('home');

  useEffect(() => {
    if (socket.table && ['home', 'lobby'].includes(activeView)) {
      setActiveView('table');
    }
  }, [activeView, socket.table]);

  if (auth.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="surface rounded-md p-8 text-center">
          <img src="/assets/chip.svg" alt="" className="mx-auto h-16 w-16 animate-pulse" />
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

  return (
    <div className="min-h-screen">
      <NavBar
        activeView={activeView}
        setActiveView={setActiveView}
        profile={auth.profile}
        connected={socket.connected}
        onLogout={auth.logout}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
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
      </main>

      <Notice notice={socket.notice} onClose={socket.clearNotice} />
    </div>
  );
}
