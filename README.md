# IM Discord Bot

OLED-themed Discord bot with a darker black-and-blue embed style, dynamic prefix commands, comprehensive moderation tools, anti-raid protection, and advanced security features.

**Dynamic Prefix:** Defaults to `?` but configurable per server (Enable Message Content intent in the Discord Developer Portal.)

## ✨ New Features

### 🔧 Dynamic Configuration & Aliases
- **Dynamic Prefix**: Set custom prefix per server with `?prefix set <symbol>` (alias: `?px`)
- **Command Aliases**: All commands now have short aliases (e.g., `?help` → `?h`, `?purge` → `?p`)
- **Permission-Aware Help**: Help command shows only commands you can actually use with aliases displayed
- **Multi-Word Commands**: Support for commands like `lockdown all`, `purge between`, `notes add`, etc.
- **Instant Command Cleanup**: Commands are deleted immediately to keep channels clean

### 🎨 Visual Enhancements
- **Gradient Embeds**: All embeds now feature automatic deep blue to black gradient banners
- **Consistent Theming**: Dark OLED-friendly color scheme throughout
- **Rich Visual Feedback**: Enhanced embed formatting with contextual colors and timestamps

### 🛡️ Enhanced Security & Moderation
- **Advanced Purge System**: Multiple purge modes with no confirmation required:
  - `?purge <count>` (alias: `?p`) - Delete 1-100 messages
  - `?purge all` - Delete all messages in channel (batched)
  - `?purge between <id1> <id2>` - Delete messages in ID range
  - `?purge bots/humans` - Delete messages from bots or humans only
  - `?purge links/invites` - Delete messages containing links or Discord invites
  - `?purge contains/startswith/endswith <text>` - Delete messages matching text patterns
- **Temporary Bans**: `?tempban @user <duration> [reason]` (alias: `?tb`) - Auto-expiring bans
- **Soft Bans**: `?softban @user [reason]` (alias: `?sb`) - Ban and immediately unban to delete messages
- **Jail System**: `?jail/@unjail/@jaillist` - Role-based punishment with automatic role restoration
- **User Notes**: `?notes add/remove/clear/@user` - Persistent user annotation system
- **Thread Management**: `?thread lock/unlock` - Basic thread moderation

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
- `?lockdown [reason]` (alias: `?ld`) - Lock current channel
- `?lockdown all [reason]` - Lock all channels
- `?lockdown role <@role>` - Set lockdown target role
- `?lockdown ignore add/remove/list [#channel]` - Manage lockdown ignore list
- `?unlock all` (alias: `?ul`) - Remove lockdown from all channels
- `?jail @user <duration> [reason]` - Jail user with role removal (supports 1s, 5m, 2h, 7d, perm)
- `?unjail @user` - Remove user from jail and restore roles
- `?jaillist` - List all currently jailed users
- `?snipe` (alias: `?s`) - Show last deleted message in channel

### 🔨 Moderation Commands  
**Enhanced Purge System:**
- `?purge <1-100> [reason]` (alias: `?p`) - Delete recent messages
- `?purge all` - Delete ALL messages (no confirmation required)  
- `?purge between <startId> <endId>` - Delete messages in range
- `?purge bots` - Delete messages from bots only
- `?purge humans` - Delete messages from humans only
- `?purge links` - Delete messages containing links
- `?purge invites` - Delete messages containing Discord invites
- `?purge contains <text>` - Delete messages containing specific text
- `?purge startswith <text>` - Delete messages starting with text
- `?purge endswith <text>` - Delete messages ending with text

**User Management:**
- `?kick @user [reason]` (alias: `?k`)
- `?ban @user [days] [reason]` (alias: `?b`) 
- `?unban <userId> [reason]` (alias: `?ub`)
- `?tempban @user <duration> [reason]` (alias: `?tb`) - Temporary ban with auto-unban
- `?softban @user [reason]` (alias: `?sb`) - Ban and immediately unban to delete messages
- `?timeout @user <duration> [reason]` (aliases: `?to`, `?mute`)

**User Notes System:**
- `?notes @user` - View all notes for a user
- `?notes add @user <note>` - Add a note to a user
- `?notes remove @user <noteId>` - Remove a specific note
- `?notes clear @user` - Clear all notes for a user

**Other Moderation:**
- `?nuke` (alias: `?nk`) - Completely recreate current channel
- `?thread lock/unlock [reason]` - Lock/unlock current thread
- `?lock` / `?unlock` - Channel message permissions
- `?slowmode <seconds>` (alias: `?sm`)
- `?nick @user <nickname>` (alias: `?nn`)
- `?warn @user <reason>` (alias: `?w`)
- `?warnings @user` (alias: `?ws`)
- `?clearwarns @user` (alias: `?cw`)

### ⚙️ Utility Commands
- `?help [command]` (alias: `?h`) - Dynamic help with permission filtering and aliases
- `?prefix` (alias: `?px`) - Show current server prefix
- `?prefix set <symbol>` - Set new prefix (Administrator only)
- `?prefix remove` - Reset to default prefix (Administrator only)
- `?botstatus` (aliases: `?bs`, `?status`) - Bot statistics and uptime
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

## 🌟 Advanced Features & Examples

### Command Aliases System
Every command now has intuitive short aliases:
```bash
?help              # Can also use: ?h
?purge 50          # Can also use: ?p 50
?tempban @user 1d  # Can also use: ?tb @user 1d
?jail @user 2h     # Temporary jail for 2 hours
?notes add @user "Frequent rule violations"
```

### Intelligent Purge System
The enhanced purge system offers precise message filtering:
```bash
?purge bots              # Delete only bot messages
?purge humans            # Delete only human messages  
?purge links             # Delete messages with URLs
?purge invites           # Delete Discord invite links
?purge contains "spam"   # Delete messages containing "spam"
?purge startswith "!"    # Delete messages starting with "!"
?purge all               # Delete everything (no confirmation needed)
```

### Advanced User Management
```bash
# Temporary punishments with automatic expiry
?tempban @user 7d "Repeated violations"    # Auto-unbans in 7 days
?jail @user 1h "Cooling off period"       # Removes roles, restores after 1h
?softban @user "Clean up their messages"   # Ban+unban to delete message history

# Persistent user notes for moderation tracking
?notes add @user "Warning given for spam"
?notes add @user "Helpful community member"
?notes @user                               # View all notes
```

### Permission-Aware Help
The help system intelligently shows only what you can use:
- Moderators see moderation commands
- Administrators see all commands
- Regular users see only utility commands
- All commands show their aliases inline

### Visual Gradient Embeds
All bot responses now feature automatic gradient banners (deep blue → black) for a premium look while maintaining OLED-friendly dark theming.

## 🔧 Required Permissions

The bot needs these Discord permissions to function properly:
- **Manage Messages** - Message deletion, purge commands
- **Manage Channels** - Lockdown, nuke, permission management  
- **Manage Roles** - Jail system, role management
- **Kick Members** - Kick command
- **Ban Members** - Ban/unban/tempban/softban commands  
- **Moderate Members** - Timeout command, notes system
- **Manage Guild** - Settings management
- **Manage Expressions** - Emoji management
- **View Audit Log** - Anti-nuke monitoring
- **Manage Threads** - Thread lock/unlock

## 📊 Data Storage

Settings and data are stored in `data/kv.json` and in-memory systems:
- **Guild Settings**: Prefixes, lockdown config, filter settings
- **AFK Status**: User away messages and mentions
- **Embed Templates**: Custom embed storage
- **Warnings**: User warning tracking
- **User Notes**: Persistent moderation annotations (in-memory)
- **Temporary Bans**: Auto-expiring ban system (in-memory)
- **Jail System**: Role preservation and restoration (in-memory)

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