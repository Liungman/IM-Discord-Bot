# IM Discord Bot

OLED-themed Discord bot with a darker black-and-blue embed style, classic prefix commands, admin/mod tools, and anti-nuke safeguards.

Prefix: `?` (Enable Message Content intent in the Discord Developer Portal.)

## Features

- Dark black-and-blue embed theme
- Prefix commands with `?` (moderation, security, AFK, embed tools, fun, utility)
- Usage tracking: `?topcommands`
- Snipe system: `?snipe` for last deleted message
- Auto-deleting responses and command invocations (configurable)
- Rotating presence showing help hint, server count, and ping
- Bot status command: `?botstatus` (uptime, ping, memory)

## Setup

1) Create `.env` and set:
   ```
   DISCORD_TOKEN=your_token_here
   ```
2) In the Discord Developer Portal, turn on "Message Content Intent".
3) Install and run:

```bash
npm ci
npm run dev
# or
npm run build && npm start
```

## Example Commands

Moderation:
- `?purge 20`
- `?kick @user spamming`
- `?ban @user 1 breaking rules`
- `?unban 123456789012345678 appeal accepted`
- `?timeout @user 2h take a breather`
- `?lock` / `?unlock`
- `?slowmode 5`
- `?nick @user New Nick`
- `?warn @user rule 1`
- `?warnings @user`
- `?clearwarns @user`

Security/Misc:
- `?invites`
- `?addemote <:smile:123456789012345678> smile`
- `?antinuke status|on|off`
- `?settings show`
- `?settings set autoDeleteMs 10000`
- `?settings set antiNuke.thresholds.ChannelDelete 2`

AFK:
- `?afk Sleeping`
- `?afkmentions`

Embed Manager:
- `?defaultembed Title | Description`
- `?embedcreate welcome "{ \"title\": \"Welcome!\", \"description\": \"Read the rules.\" }"`
- `?embedsend welcome`
- `?embedlist`
- `?embeddelete welcome`
- `?embedcode <message link>`

Fun/Utility:
- `?help [command]`
- `?botstatus`
- `?ping`
- `?avatar @user`
- `?userinfo [@user]`
- `?serverinfo`
- `?say hello`
- `?topcommands`

## Notes

- The bot needs appropriate permissions (Manage Messages, Kick Members, Ban Members, Moderate Members, Manage Channels, Manage Guild, Manage Expressions, View Audit Log).
- AFK, embeds, settings and warnings write to `data/kv.json`.