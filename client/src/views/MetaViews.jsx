import { Award, Bell, Bot, CheckCircle2, Coins, Gift, Lock, MessageCircle, ShieldAlert, ShoppingBag, Star, Trophy, Users } from 'lucide-react';
import { achievements, friendRows, leaderboardRows, missions, passRewards, shopItems } from '../lib/demoData.js';
import { formatNumber } from '../lib/format.js';

export function MissionsView() {
  return (
    <SurfacePage title="Missions" subtitle="Daily and weekly chip routes.">
      <div className="grid gap-4 lg:grid-cols-3">
        {missions.map((mission) => (
          <article key={mission.id} className="surface-soft rounded-md p-5">
            <Gift className="h-6 w-6 text-brass" />
            <h2 className="mt-4 text-lg font-black">{mission.title}</h2>
            <Progress value={(mission.progress / mission.target) * 100} />
            <p className="mt-3 text-sm text-white/55">{mission.progress}/{mission.target} · {formatNumber(mission.reward.chips)} chips · {mission.reward.xp} XP</p>
          </article>
        ))}
      </div>
    </SurfacePage>
  );
}

export function LeaderboardsView() {
  return (
    <SurfacePage title="Leaderboards" subtitle="Global, weekly, monthly, seasonal, and friends ladders.">
      <div className="surface-soft overflow-hidden rounded-md">
        {leaderboardRows.map((row, index) => (
          <div key={row.name} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-b border-white/10 px-5 py-4 last:border-b-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass text-sm font-black text-ink">#{index + 1}</div>
            <div>
              <p className="font-black">{row.name}</p>
              <p className="text-sm text-white/50">{row.blackjacks} blackjacks</p>
            </div>
            <p className="font-black text-brass">{formatNumber(row.score)}</p>
          </div>
        ))}
      </div>
    </SurfacePage>
  );
}

export function FriendsView() {
  return (
    <SurfacePage title="Friends" subtitle="Invite, join, and chat with your table crew.">
      <div className="grid gap-4 lg:grid-cols-3">
        {friendRows.map((friend) => (
          <article key={friend.id} className="surface-soft rounded-md p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-black">{friend.name[0]}</div>
              <div>
                <p className="font-black">{friend.name}</p>
                <p className="text-sm text-white/[0.52]">{friend.status}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>{friend.rank}</span>
              <span className="text-brass">{friend.streak} streak</span>
            </div>
            <button type="button" className="btn btn-secondary mt-4 w-full">
              <Users className="h-4 w-4" />
              Invite
            </button>
          </article>
        ))}
      </div>
    </SurfacePage>
  );
}

export function ShopView() {
  return (
    <SurfacePage title="Shop" subtitle="Cosmetic-only unlocks.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {shopItems.map((item) => (
          <article key={item.id} className="surface-soft rounded-md p-4">
            <div className="flex aspect-square items-center justify-center rounded-md border border-white/10 bg-gradient-to-br from-brass/25 via-white/[0.08] to-ruby/20">
              <ShoppingBag className="h-10 w-10 text-brass" />
            </div>
            <h2 className="mt-4 font-black">{item.name}</h2>
            <p className="mt-1 text-sm text-white/50">{item.category} · {item.rarity}</p>
            <button type="button" className="btn btn-secondary mt-4 w-full">
              <Coins className="h-4 w-4" />
              {formatNumber(item.price)}
            </button>
          </article>
        ))}
      </div>
    </SurfacePage>
  );
}

export function BattlePassView() {
  return (
    <SurfacePage title="Battle Pass" subtitle="Free and premium cosmetic tracks.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {passRewards.slice(0, 12).map((reward) => (
          <article key={reward.tier} className="surface-soft rounded-md p-4">
            <div className="flex items-center justify-between">
              <span className="badge">Tier {reward.tier}</span>
              <Star className="h-5 w-5 text-brass" />
            </div>
            <RewardLine label="Free" reward={reward.free} />
            <RewardLine label="Premium" reward={reward.premium} locked />
          </article>
        ))}
      </div>
    </SurfacePage>
  );
}

export function ProfileView({ profile, table }) {
  const seat = table?.seats?.find((item) => item.playerId === profile.id);
  const stats = seat?.stats;

  return (
    <SurfacePage title="Profile" subtitle="Progression, rank, statistics, and achievements.">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="surface-soft rounded-md p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brass text-3xl font-black text-ink">{profile.username?.[0]}</div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black">{profile.username}</h2>
              <p className="text-sm text-white/50">{profile.isGuest ? 'Guest profile' : profile.email}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <InfoRow label="Rank" value={seat?.rank ?? 'Bronze'} />
            <InfoRow label="Level" value={seat?.level ?? 1} />
            <InfoRow label="XP" value={formatNumber(seat?.xp ?? 0)} />
            <InfoRow label="Chips" value={formatNumber(seat?.chips ?? 25000)} />
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoTile icon={Trophy} label="Games" value={stats?.totalGames ?? 0} />
          <InfoTile icon={Award} label="Wins" value={stats?.totalWins ?? 0} />
          <InfoTile icon={CheckCircle2} label="Blackjacks" value={stats?.totalBlackjacks ?? 0} />
          <InfoTile icon={Coins} label="Earned" value={formatNumber(stats?.totalChipsEarned ?? 0)} />
          <InfoTile icon={ShieldAlert} label="Streak" value={stats?.highestWinStreak ?? 0} />
          <InfoTile icon={Gift} label="Achievements" value={achievements.filter((item) => item.unlocked).length} />
        </section>
      </div>
    </SurfacePage>
  );
}

export function SettingsView() {
  return (
    <SurfacePage title="Settings" subtitle="Audio, notifications, privacy, and table preferences.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Toggle label="Card sounds" enabled />
        <Toggle label="Chip sounds" enabled />
        <Toggle label="Dealer voice" />
        <Toggle label="Ambient music" />
        <Toggle label="Friend invites" enabled />
        <Toggle label="Table reactions" enabled />
      </div>
    </SurfacePage>
  );
}

export function AdminView() {
  return (
    <SurfacePage title="Admin" subtitle="Operational controls for live service management.">
      <div className="grid gap-4 lg:grid-cols-4">
        <InfoTile icon={Bot} label="Reports" value="0" />
        <InfoTile icon={ShieldAlert} label="Bans" value="0" />
        <InfoTile icon={Coins} label="Economy Flags" value="0" />
        <InfoTile icon={Bell} label="Events" value="1" />
      </div>
      <div className="surface-soft mt-5 rounded-md p-5">
        <p className="font-black">Server authority is active</p>
        <p className="mt-2 text-sm leading-6 text-white/[0.58]">Cards, shuffles, payouts, XP, rank changes, and currency changes are controlled by the backend. Firestore writes are reserved for trusted server operations.</p>
      </div>
    </SurfacePage>
  );
}

export function ChatView({ table, profile }) {
  return (
    <SurfacePage title="Chat" subtitle="Global, table, friend, and private chat surface.">
      <div className="surface-soft rounded-md p-5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-brass" />
          <p className="font-black">{table ? table.name : 'No active table'}</p>
        </div>
        <div className="mt-4 grid gap-3">
          {(table?.chat ?? []).map((message) => (
            <div key={message.id} className="rounded-md border border-white/10 bg-black/[0.18] p-3">
              <p className="text-xs text-brass">{message.username === profile.username ? 'You' : message.username}</p>
              <p className="mt-1 text-sm text-white/[0.72]">{message.text}</p>
            </div>
          ))}
        </div>
        {!table ? <p className="mt-4 text-sm text-white/50">Join a table to send table chat.</p> : null}
      </div>
    </SurfacePage>
  );
}

function SurfacePage({ title, subtitle, children }) {
  return (
    <div className="space-y-5">
      <section className="surface rounded-md p-5">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="muted mt-1">{subtitle}</p>
      </section>
      {children}
    </div>
  );
}

function Progress({ value }) {
  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-brass" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function RewardLine({ label, reward, locked }) {
  const text = reward.cosmetic ?? `${formatNumber(reward.chips ?? reward.coins ?? reward.xp)} ${reward.chips ? 'chips' : reward.coins ? 'coins' : 'XP'}`;
  return (
    <div className="mt-4 rounded-md border border-white/10 bg-black/[0.18] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-white/[0.48]">{label}</p>
        {locked ? <Lock className="h-4 w-4 text-white/35" /> : <CheckCircle2 className="h-4 w-4 text-brass" />}
      </div>
      <p className="mt-1 truncate font-black">{text}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/[0.18] px-3 py-2 text-sm">
      <span className="text-white/50">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="surface-soft rounded-md p-5">
      <Icon className="h-6 w-6 text-brass" />
      <p className="mt-4 text-sm text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Toggle({ label, enabled }) {
  return (
    <div className="surface-soft flex items-center justify-between gap-4 rounded-md p-5">
      <span className="font-semibold">{label}</span>
      <button type="button" className={enabled ? 'h-7 w-12 rounded-full bg-brass p-1' : 'h-7 w-12 rounded-full bg-white/15 p-1'} aria-label={label}>
        <span className={enabled ? 'block h-5 w-5 translate-x-5 rounded-full bg-ink transition' : 'block h-5 w-5 rounded-full bg-white/65 transition'} />
      </button>
    </div>
  );
}
