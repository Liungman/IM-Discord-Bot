# IM Discord Bot

OLED-themed Discord bot with a darker black-and-blue embed style, dynamic prefix commands, comprehensive moderation tools, anti-raid protection, and advanced security features.

**Dynamic Prefix:** Defaults to `?` but configurable per server (Enable Message Content intent in the Discord Developer Portal.)

## ✨ New Features

### 🔧 Dynamic Configuration
- **Dynamic Prefix**: Set custom prefix per server with `?prefix set <symbol>`
- **Permission-Aware Help**: Help command shows only commands you can actually use
- **Multi-Word Commands**: Support for commands like `lockdown all`, `purge between`, etc.
- **Instant Command Cleanup**: Commands are deleted immediately to keep channels clean

### 🛡️ Enhanced Security & Moderation
- **Advanced Purge**: `?purge all` (delete everything), `?purge between <id1> <id2>` (range deletion)
- **Channel Nuke**: `?nuke` completely recreates a channel (removes all history)
- **Lockdown System**: Lock single/all channels, ignore lists, custom target roles
- **Anti-Raid Protection**: Automatic lockdown on mass joins with configurable thresholds
- **Message Filters**: Block links/invites per channel with whitelist support
- **Thread Management**: Basic thread lock/unlock commands

### 🎯 Advanced Lockdown Commands
- `?lockdown` - Lock current channel
- `?lockdown all` - Lock all channels  
- `?lockdown role <@role>` - Set which role to lock (default: @everyone)
- `?lockdown ignore add/remove/list` - Manage ignore list for lockdown operations
- `?unlock all` - Remove lockdown from all channels

## 🚀 Setup

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

## 📋 Command Categories

### 🛡️ Security Commands
- `?antinuke status|on|off` - Anti-nuke protection settings
- `?settings show|set <path> <value>` - View/modify server settings  
- `?lockdown [reason]` - Lock current channel
- `?lockdown all [reason]` - Lock all channels (with confirmation)
- `?lockdown role <@role>` - Set lockdown target role
- `?lockdown ignore add/remove/list [#channel]` - Manage lockdown ignore list

### 🔨 Moderation Commands  
- `?purge <1-100> [reason]` - Delete recent messages
- `?purge all` - Delete ALL messages (with confirmation)  
- `?purge between <startId> <endId>` - Delete messages in range
- `?nuke` - Completely recreate current channel (with confirmation)
- `?unlock all` - Remove lockdown from all channels
- `?thread lock/unlock [reason]` - Lock/unlock current thread
- `?kick @user [reason]`
- `?ban @user [days] [reason]` 
- `?unban <userId> [reason]`
- `?timeout @user <duration> [reason]`
- `?lock` / `?unlock` - Channel message permissions
- `?slowmode <seconds>`
- `?nick @user <nickname>`
- `?warn @user <reason>`
- `?warnings @user`
- `?clearwarns @user`

### ⚙️ Utility Commands
- `?help [command]` - Dynamic help with permission filtering
- `?prefix` - Show current server prefix
- `?prefix set <symbol>` - Set new prefix (Administrator only)
- `?prefix remove` - Reset to default prefix (Administrator only)
- `?botstatus` - Bot statistics and uptime
- `?ping` - Bot latency
- `?avatar [@user]` - User avatar
- `?userinfo [@user]` - User information
- `?serverinfo` - Server information
- `?say <message>` - Make bot say something
- `?topcommands` - Usage statistics

### 🎮 AFK System
- `?afk [message]` - Set AFK status
- `?afkmentions` - View mentions received while AFK

### 🎨 Embed Manager
- `?defaultembed <title> | <description>` - Quick embed creation
- `?embedcreate <name> <JSON>` - Create named embed template
- `?embedsend <name>` - Send saved embed
- `?embedlist` - List all saved embeds
- `?embeddelete <name>` - Delete saved embed
- `?embedcode <message link>` - Get embed JSON from message

### 🎯 Additional Tools
- `?invites` - Server invite information
- `?addemote <emoji> <name>` - Add server emoji
- `?snipe` - Show last deleted message

## 🔒 Security Features

### Anti-Raid Protection
- **Automatic Detection**: Monitors join rates within configurable time windows
- **Smart Actions**: Auto-lockdown with timed unlocking
- **Logging**: Optional mod log channel notifications
- **Configurable**: Adjust thresholds, window timing, and response actions

### Message Filtering  
- **Link Filter**: Block/allow specific domains per channel
- **Invite Filter**: Block Discord invites with role exemptions
- **Whitelist Support**: Exempt specific URLs from link filtering
- **Role Exemptions**: Bypass filters for trusted roles

### Advanced Lockdown System
- **Granular Control**: Lock individual channels or entire server
- **Ignore Lists**: Exclude specific channels from mass operations  
- **Custom Target Roles**: Lock specific roles instead of @everyone
- **Confirmation Required**: Dangerous operations require explicit confirmation

## ⚙️ Configuration Examples

```bash
# Set custom prefix
?prefix set !

# Configure anti-raid (via settings command)
?settings set antiRaid.enabled true
?settings set antiRaid.joinThreshold 10  
?settings set antiRaid.windowMs 30000
?settings set antiRaid.logChannelId 123456789012345678

# Set lockdown target role
?lockdown role @Members

# Add channels to lockdown ignore list  
?lockdown ignore add #staff-chat
?lockdown ignore add #mod-logs
```

## 🔧 Required Permissions

The bot needs these Discord permissions to function properly:
- **Manage Messages** - Message deletion, purge commands
- **Manage Channels** - Lockdown, nuke, permission management
- **Kick Members** - Kick command
- **Ban Members** - Ban/unban commands  
- **Moderate Members** - Timeout command
- **Manage Guild** - Settings management
- **Manage Expressions** - Emoji management
- **View Audit Log** - Anti-nuke monitoring
- **Manage Threads** - Thread lock/unlock

## 📊 Data Storage

Settings and data are stored in `data/kv.json`:
- **Guild Settings**: Prefixes, lockdown config, filter settings
- **AFK Status**: User away messages and mentions
- **Embed Templates**: Custom embed storage
- **Warnings**: User warning tracking

## 🌟 Advanced Usage

### Multi-Word Commands
The bot supports complex command structures:
- `?lockdown ignore add #channel` 
- `?purge between 123456789 987654321`
- `?prefix set !`
- `?thread lock Temporary maintenance`

### Permission-Aware Help
The help system intelligently filters commands:
- Only shows commands you have permission to use
- Adapts to your server role and permissions
- Updates command examples with your server's prefix

### Instant Command Cleanup  
- Commands are deleted immediately when possible
- Responses auto-delete after configured time
- Keeps channels clean and reduces clutter