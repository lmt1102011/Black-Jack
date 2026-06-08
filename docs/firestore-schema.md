# Firestore Schema

## Collections

### `users/{uid}`

- `email`
- `createdAt`
- `lastLoginAt`
- `disabled`
- `roles`

### `profiles/{uid}`

- `username`
- `avatar`
- `level`
- `xp`
- `rank`
- `rankPoints`
- `prestige`
- `selectedCosmetics`

### `statistics/{uid}`

- `totalGames`
- `totalWins`
- `totalLosses`
- `totalDraws`
- `winRate`
- `totalBlackjacks`
- `highestWinStreak`
- `largestPotWon`
- `totalChipsEarned`
- `totalChipsLost`
- `averageMatchDuration`

### `friends/{uid}/items/{friendUid}`

- `friendUid`
- `status`
- `createdAt`
- `lastInteractionAt`

### `friendRequests/{requestId}`

- `fromUid`
- `toUid`
- `status`
- `createdAt`
- `respondedAt`

### `messages/{messageId}`

- `roomId`
- `senderUid`
- `text`
- `type`
- `createdAt`
- `moderationFlags`

### `chatRooms/{roomId}`

- `type`
- `memberUids`
- `lastMessageAt`

### `tables/{tableId}`

- `code`
- `type`
- `phase`
- `players`
- `spectators`
- `limits`
- `updatedAt`

### `matches/{matchId}`

- `tableId`
- `roundId`
- `dealerCards`
- `results`
- `createdAt`

### `leaderboards/{boardId}/entries/{uid}`

- `score`
- `blackjacks`
- `chipsEarned`
- `winStreak`
- `updatedAt`

### `missions/{uid}/items/{missionId}`

- `title`
- `progress`
- `target`
- `reward`
- `expiresAt`

### `achievements/{uid}/items/{achievementId}`

- `title`
- `unlockedAt`
- `reward`

### `battlePass/{uid}`

- `seasonId`
- `tier`
- `xp`
- `premium`
- `claimedTiers`

### `shopItems/{itemId}`

- `category`
- `name`
- `rarity`
- `price`
- `enabled`

### `inventory/{uid}/items/{itemId}`

- `itemId`
- `category`
- `acquiredAt`
- `source`

### `seasonData/{seasonId}`

- `startsAt`
- `endsAt`
- `rankResetRules`
- `rewards`

### `events/{eventId}`

- `title`
- `startsAt`
- `endsAt`
- `missionIds`
- `rewardRules`

### `notifications/{uid}/items/{notificationId}`

- `title`
- `body`
- `readAt`
- `createdAt`
