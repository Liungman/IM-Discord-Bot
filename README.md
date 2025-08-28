# IM Discord Bot

OLED-themed Discord bot (black base with neon dark-blue accent) with lots of classic prefix commands alongside slash support.

Prefix: `?` (Enable Message Content intent in the Discord Developer Portal.)

## Features

- OLED embed theme (near-black + neon blue)
- Prefix commands with `?` (moderation, security, AFK, embed tools, fun, utility)
- Usage tracking: `?topcommands`
- Snipe system: `?snipe` for last deleted message

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
- `?timeout @user 2h take a breather`
- `?lock` / `?unlock`
- `?slowmode 5`
- `?nick @user New Nick`

Security/Misc:
- `?invites`
- `?addemote <:smile:123456789012345678> smile`
- `?charinfo abc`
- `?snipe`

AFK:
- `?afk Sleeping`
- `?afkmentions`

Embed Manager:
- `?embedcreate welcome "{ \"title\": \"Welcome!\", \"description\": \"Read the rules.\" }"`
- `?embedsend welcome`
- `?embedlist`
- `?embeddelete welcome`
- `?embedcode <message link>`

Fun:
- `?uwu hello friend`
- `?freaky fear me`
- `?jumbo 😺`
- `?rps rock`
- `?choose red | blue | green`
- `?wouldyourather`
- `?randomhex`
- `?color #00c8ff`
- `?quickpoll Do you like the OLED theme?`
- `?coinflip`
- `?reverse hello`
- `?leet hello`
- `?mock hello`
- `?clap this is great`
- `?vaporwave hello world`
- `?fullwidth hello`
- `?8ball Will this work?`
- `?dice 3d6`
- `?joke`

Utility:
- `?help [command]`
- `?ping`
- `?avatar @user`
- `?userinfo [@user]`
- `?serverinfo`
- `?say hello`
- `?topcommands`

## Notes

- The bot needs appropriate permissions (Manage Messages, Kick Members, Ban Members, Moderate Members, Manage Channels, Manage Guild, Manage Expressions).
- AFK, embeds, and other data write to `data/kv.json`.