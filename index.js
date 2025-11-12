/*

  !- ©ᴍᴀʟᴠɪɴ-dev
  https://wa.me/263714757857
  
*/

require("./all/global")
const func = require("./all/place")
const readline = require("readline")
const chalk = require('chalk')
const CFonts = require('cfonts')
const { getBuffer } = require('./all/myfunc')
const NodeCache = require("node-cache")
const msgRetryCounterCache = new NodeCache()
const yargs = require('yargs/yargs')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')

// Add missing imports
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore, DisconnectReason, generateWAMessageFromContent } = require('@whiskeysockets/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const color = require('./all/color')

// Import ntandostore features
const ntandoStore = require('./ntandostore')

const usePairingCode = true

// Anti-spam and protection features
const spamCache = new NodeCache({ stdTTL: 60 })
const messageCache = new NodeCache({ stdTTL: 10 })
const rateLimitCache = new NodeCache({ stdTTL: 3600 })
const cooldownCache = new NodeCache({ stdTTL: 5 })

// Enhanced Configuration
const SPAM_CONFIG = {
    maxMessagesPerMinute: 8,
    maxMessagesPerHour: 150,
    commandCooldown: 2,
    maxGroupMessagesPerHour: 300,
    banDuration: 3600,
    warningThreshold: 3,
    maxRetries: 3,
    retryDelay: 2000
}

// User warnings tracking
const userWarnings = new NodeCache({ stdTTL: 86400 })

// Session data
let sessionData = {
    startTime: Date.now(),
    messagesProcessed: 0,
    commandsExecuted: 0,
    errorsEncountered: 0,
    lastError: null
}

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close()
            resolve(answer)
        })
    })
}

// Anti-spam checker
function checkSpam(userId) {
    const userSpamData = spamCache.get(userId) || { count: 0, firstMessage: Date.now() }
    const currentTime = Date.now()
    const timeElapsed = (currentTime - userSpamData.firstMessage) / 1000

    if (timeElapsed > 60) {
        userSpamData.count = 1
        userSpamData.firstMessage = currentTime
    } else {
        userSpamData.count++
    }

    spamCache.set(userId, userSpamData)

    if (userSpamData.count > SPAM_CONFIG.maxMessagesPerMinute) {
        return { isSpam: true, count: userSpamData.count }
    }

    return { isSpam: false, count: userSpamData.count }
}

// Rate limit checker
function checkRateLimit(userId, isGroup = false) {
    const rateLimitKey = `ratelimit_${userId}`
    const rateLimitData = rateLimitCache.get(rateLimitKey) || { count: 0, timestamp: Date.now() }
    
    const maxMessages = isGroup ? SPAM_CONFIG.maxGroupMessagesPerHour : SPAM_CONFIG.maxMessagesPerHour
    const currentTime = Date.now()
    const hourElapsed = (currentTime - rateLimitData.timestamp) / 1000 / 3600

    if (hourElapsed > 1) {
        rateLimitData.count = 1
        rateLimitData.timestamp = currentTime
    } else {
        rateLimitData.count++
    }

    rateLimitCache.set(rateLimitKey, rateLimitData)

    return rateLimitData.count <= maxMessages
}

// Command cooldown checker
function checkCooldown(userId, command) {
    const cooldownKey = `cooldown_$${userId}_$$ {command}`
    const hasCooldown = cooldownCache.get(cooldownKey)

    if (hasCooldown) {
        return false
    }

    cooldownCache.set(cooldownKey, true, SPAM_CONFIG.commandCooldown)
    return true
}

// Ban checker
function isUserBanned(userId) {
    const banKey = `ban_${userId}`
    return spamCache.get(banKey) || false
}

// Ban user
function banUser(userId, duration = SPAM_CONFIG.banDuration) {
    const banKey = `ban_${userId}`
    spamCache.set(banKey, true, duration)
    console.log(chalk.red(`User $${userId} has been temporarily banned for$$ {duration}s`))
}

// Warning system
function addWarning(userId) {
    const warnings = userWarnings.get(userId) || 0
    const newWarnings = warnings + 1
    userWarnings.set(userId, newWarnings)

    if (newWarnings >= SPAM_CONFIG.warningThreshold) {
        banUser(userId)
        userWarnings.del(userId)
        return { banned: true, warnings: newWarnings }
    }

    return { banned: false, warnings: newWarnings }
}

// Delay functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const randomDelay = () => delay(Math.floor(Math.random() * 1000) + 500)

// Save session data periodically
function saveSessionData() {
    try {
        fs.writeFileSync('./session_data.json', JSON.stringify(sessionData, null, 2))
    } catch (err) {
        console.log(chalk.red('Failed to save session data:', err.message))
    }
}

// Load session data
function loadSessionData() {
    try {
        if (fs.existsSync('./session_data.json')) {
            const data = fs.readFileSync('./session_data.json', 'utf8')
            sessionData = { ...sessionData, ...JSON.parse(data) }
        }
    } catch (err) {
        console.log(chalk.yellow('No previous session data found, starting fresh'))
    }
}

async function startSesi() {
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const { version, isLatest } = await fetchLatestBaileysVersion()

    loadSessionData()

    console.log(chalk.red(`╔═══════════════════════════════════╗`))
    console.log(chalk.red(`║  Script by ntandomods | Dev      ║`))
    console.log(chalk.red(`║  WhatsApp: 263718456744           ║`))
    console.log(chalk.red(`╚═══════════════════════════════════╝`))
    console.log(chalk.cyan(`\nInitializing Ladybug Bot...`))
    console.log(chalk.green(`✓ Anti-spam protection enabled`))
    console.log(chalk.green(`✓ Rate limiting active`))
    console.log(chalk.green(`✓ Store features loaded`))
    console.log(chalk.green(`✓ Auto-backup enabled\n`))

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Ladybug Bot', 'Safari', '4.0.0'],
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id, undefined)
                return msg?.message || undefined
            }
            return {
                conversation: 'ntandomods|dev'
            }
        }
    }

    const Nano = func.makeWASocket ? func.makeWASocket(connectionOptions) : makeWASocket(connectionOptions)

    // Initialize store with Nano instance
    ntandoStore.initialize(Nano)

    if (usePairingCode && !Nano.authState.creds.registered) {
        var phoneNumber = await question(chalk.black(chalk.bgCyan(`\n📱 ENTER BOT NUMBER (with country code, e.g., 263xxx): \n`)))
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
        var code = await Nano.requestPairingCode(phoneNumber.trim())
        console.log(chalk.black(chalk.bgCyan(`\n🔐 Pairing Code: `)), chalk.black(chalk.bgWhite(` ${code} `)))
    }

    Nano.ev.on('creds.update', saveCreds)
    store?.bind(Nano.ev)

    Nano.public = global.public !== undefined ? global.public : true

    // Enhanced send message with retry and queue
    Nano.sendMessageSafe = async (jid, content, options = {}) => {
        let retries = 0
        while (retries < SPAM_CONFIG.maxRetries) {
            try {
                await randomDelay()
                const result = await Nano.sendMessage(jid, content, options)
                return result
            } catch (err) {
                retries++
                console.log(chalk.yellow(`Send message attempt ${retries} failed: ${err.message}`))
                
                if (retries >= SPAM_CONFIG.maxRetries) {
                    sessionData.errorsEncountered++
                    sessionData.lastError = err.message
                    throw err
                }
                
                await delay(SPAM_CONFIG.retryDelay * retries)
            }
        }
    }

    // Attach store methods to Nano
    Nano.store = ntandoStore

    async function start() {
        try {
            await delay(3000)
            await Nano.newsletterFollow("1203634020@newsletter").catch(() => {})
            
            // Auto-save session data every 5 minutes
            setInterval(() => {
                saveSessionData()
            }, 300000)
            
        } catch (err) {
            console.log(chalk.yellow("Startup routine error:", err.message))
        }
    }

    // Enhanced message handler
    Nano.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            let m = chatUpdate.messages[0]
            if (!m.message) return

            const messageId = m.key.id
            if (messageCache.get(messageId)) return
            messageCache.set(messageId, true)

            sessionData.messagesProcessed++

            m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message
            
            if (m.key && m.key.remoteJid === 'status@broadcast') {
                if (global.autoreadsw) {
                    await delay(2000)
                    await Nano.readMessages([m.key])
                }
                return
            }

            if (!Nano.public && m.key.remoteJid !== global.owner + "@s.whatsapp.net" && !m.key.fromMe && chatUpdate.type === 'notify') return
            
            if (m.key.id.startsWith('BAE5') && m.key.id.length === 16) return

            const userId = m.key.remoteJid
            const senderId = m.key.participant || m.key.remoteJid
            const isGroup = userId.endsWith('@g.us')

            if (isUserBanned(senderId)) {
                console.log(chalk.yellow(`🚫 Blocked message from banned user: ${senderId}`))
                return
            }

            const spamCheck = checkSpam(senderId)
            if (spamCheck.isSpam) {
                console.log(chalk.yellow(`⚠️ Spam detected from: $${senderId} ($$ {spamCheck.count} msgs/min)`))
                const warningResult = addWarning(senderId)
                
                if (warningResult.banned) {
                    await Nano.sendMessageSafe(userId, { 
                        text: `🚫 *BANNED*\n\nYou have been temporarily banned for spamming.\n⏰ Duration: ${SPAM_CONFIG.banDuration / 60} minutes\n\nPlease respect the bot's usage limits.` 
                    })
                } else {
                    await Nano.sendMessageSafe(userId, { 
                        text: `⚠️ *Warning $${warningResult.warnings}/$$ {SPAM_CONFIG.warningThreshold}*\n\nPlease slow down your messages to avoid being banned.` 
                    })
                }
                return
            }

            if (!checkRateLimit(senderId, isGroup)) {
                console.log(chalk.yellow(`⏱️ Rate limit exceeded for: ${senderId}`))
                addWarning(senderId)
                return
            }

            if (global.autoread) {
                await randomDelay()
                await Nano.readMessages([m.key])
            }

            m = func.smsg(Nano, m, store)
            
            const messageText = m.text || ''
            if (messageText.startsWith(global.prefix || '.')) {
                const command = messageText.split(' ')[0].substring(1)
                if (!checkCooldown(senderId, command)) {
                    console.log(chalk.yellow(`⏳ Command cooldown active for ${senderId}`))
                    return
                }
                sessionData.commandsExecuted++
            }

            require("./Ladybug.js")(Nano, m, store)
        } catch (err) {
            console.log(chalk.red("❌ Message handler error:", err.message))
            sessionData.errorsEncountered++
            sessionData.lastError = err.message
        }
    })

    // Enhanced group participant updates
    Nano.ev.on('group-participants.update', async (anu) => {
        if (global.welcome) {
            try {
                await randomDelay()
                
                let metadata = await Nano.groupMetadata(anu.id)
                let participants = anu.participants
                
                if (participants.length > 10) {
                    console.log(chalk.yellow(`⚠️ Too many participants (${participants.length}), skipping welcome/goodbye`))
                    return
                }

                for (let num of participants) {
                    await delay(1500)
                    
                    let ppuser, ppbuffer
                    try {
                        ppuser = await Nano.profilePictureUrl(num, 'image')
                    } catch {
                        ppuser = 'https://limewire.com/d/GkZlB#ocje9roWOx'
                    }

                    ppbuffer = await getBuffer(ppuser)

                    if (anu.action == 'add') {
                        let welcomeMsg = `╔═══════════════════╗
║   👋 *WELCOME!*
║   @${num.split("@")[0]}
║   
║   📖 Read group rules
║   🤝 Enjoy your stay!
╚═══════════════════╝

Group: *${metadata.subject}*
Members: *${metadata.participants.length}*`

                        await Nano.sendMessage(anu.id, {
                            image: ppbuffer,
                            caption: welcomeMsg,
                            mentions: [num]
                        })
                    } else if (anu.action == 'remove') {
                        let goodbyeMsg = `╔═══════════════════╗
║   👋 *GOODBYE!*
║   @${num.split("@")[0]}
║   
║   We'll miss you!
╚═══════════════════╝`

                        await Nano.sendMessage(anu.id, {
                            image: ppbuffer,
                            caption: goodbyeMsg,
                            mentions: [num]
                        })
                    } else if (anu.action == 'promote') {
                        await Nano.sendMessage(anu.id, {
                            text: `🎉 Congratulations @${num.split("@")[0]}!\n\nYou've been promoted to admin!`,
                            mentions: [num]
                        })
                    } else if (anu.action == 'demote') {
                        await Nano.sendMessage(anu.id, {
                            text: `📉 @${num.split("@")[0]} has been demoted from admin.`,
                            mentions: [num]
                        })
                    }
                }
            } catch (err) {
                console.log(chalk.red("Group update error:", err.message))
            }
        }
    })

    // Connection state handler with better error handling
    let reconnectAttempts = 0
    const maxReconnectDelay = 60000
    let isReconnecting = false

    Nano.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'close') {
            if (isReconnecting) return
            isReconnecting = true
            
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode
            console.log(chalk.red(`\n❌ Connection closed: ${lastDisconnect?.error?.message || 'Unknown error'}`))
            
            const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay)
            
            switch (reason) {
                case DisconnectReason.badSession:
                    console.log(chalk.red(`\n🔴 Bad Session! Please delete 'session' folder and scan again.`))
                    saveSessionData()
                    process.exit(1)
                    break
                case DisconnectReason.connectionClosed:
                    console.log(chalk.yellow(`\n🔄 Reconnecting in ${reconnectDelay/1000}s...`))
                    reconnectAttempts++
                    await delay(reconnectDelay)
                    isReconnecting = false
                    startSesi()
                    break
                case DisconnectReason.connectionLost:
                    console.log(chalk.yellow(`\n📡 Connection lost. Reconnecting in ${reconnectDelay/1000}s...`))
                    reconnectAttempts++
                    await delay(reconnectDelay)
                    isReconnecting = false
                    startSesi()
                    break
                case DisconnectReason.connectionReplaced:
                    console.log(chalk.red('\n🔴 Connection replaced by another session!'))
                    saveSessionData()
                    process.exit(1)
                    break
                case DisconnectReason.loggedOut:
                    console.log(chalk.red(`\n🔴 Device logged out! Please scan again.`))
                    saveSessionData()
                    process.exit(1)
                    break
                case DisconnectReason.restartRequired:
                    console.log(chalk.cyan('\n🔄 Restart required...'))
                    await delay(2000)
                    isReconnecting = false
                    startSesi()
                    break
                case DisconnectReason.timedOut:
                    console.log(chalk.yellow(`\n⏱️ Connection timed out. Reconnecting in ${reconnectDelay/1000}s...`))
                    reconnectAttempts++
                    await delay(reconnectDelay)
                    isReconnecting = false
                    startSesi()
                    break
                case 428:
                    console.log(chalk.red(`\n🚫 Rate limited! Waiting 30s...`))
                    await delay(30000)
                    isReconnecting = false
                    startSesi()
                    break
                case 515:
                    console.log(chalk.red(`\n🚫 Server error! Waiting 10s...`))
                    await delay(10000)
                    isReconnecting = false
                    startSesi()
                    break
                default:
                    console.log(chalk.yellow(`\n⚠️ Unknown disconnect ($${reason}). Reconnecting in$$ {reconnectDelay/1000}s...`))
                    reconnectAttempts++
                    await delay(reconnectDelay)
                    isReconnecting = false
                    startSesi()
                    break
            }
        } else if (connection === "connecting") {
            console.log(chalk.cyan('🔄 Connecting to WhatsApp...'))
        } else if (connection === "open") {
            reconnectAttempts = 0
            isReconnecting = false
            
            CFonts.say(`LADYBUG BOT`, { 
                font: 'block', 
                align: 'center', 
                colors: ['cyan', 'magenta'] 
            })
            
            console.log(chalk.green(`\n✅ Successfully connected!`))
            console.log(chalk.cyan(`📊 Session Stats:`))
            console.log(chalk.white(`   Messages: ${sessionData.messagesProcessed}`))
            console.log(chalk.white(`   Commands: ${sessionData.commandsExecuted}`))
            console.log(chalk.white(`   Errors: ${sessionData.errorsEncountered}`))
            console.log(chalk.green(`\n🛡️ Protection Status:`))
            console.log(chalk.white(`   ✓ Anti-spam active`))
            console.log(chalk.white(`   ✓ Rate limiting enabled`))
            console.log(chalk.white(`   ✓ Auto-ban system ready`))
            console.log(chalk.white(`   ✓ Store features loaded\n`))
            
            await delay(2000)
            
            try {
                await Nano.sendMessageSafe("263718456744@s.whatsapp.net", { 
                    text: `✅ *LADYBUG BOT CONNECTED*\n\n` +
                          `🕐 Time: ${new Date().toLocaleString()}\n` +
                          `📊 Messages Processed: ${sessionData.messagesProcessed}\n` +
                          `💻 Commands Executed: ${sessionData.commandsExecuted}\n\n` +
                          `🛡️ All protection systems are active!\n\n` +
                          `💡 Type *SETMENU* to configure menu settings.`
                })
            } catch (err) {
                console.log(chalk.yellow('Could not send startup notification'))
            }
            
            await start()
        }
    })

    // Call rejection
    Nano.ev.on('call', async (callData) => {
        try {
            for (let call of callData) {
                if (call.status === 'offer' && global.anticall) {
                    console.log(chalk.yellow(`📞 Auto-rejecting call from: ${call.from}`))
                    await Nano.rejectCall(call.id, call.from)
                    
                    await Nano.sendMessageSafe(call.from, {
                        text: `🚫 *Call Rejected*\n\nSorry, this bot doesn't accept calls.\nPlease send a text message instead.`
                    })
                }
            }
        } catch (err) {
            console.log(chalk.red("Call handler error:", err.message))
        }
    })

    return Nano
}

startSesi()

// Enhanced error handlers
process.on('uncaughtException', function (err) {
    console.log(chalk.red('💥 Uncaught Exception:', err.message))
    console.log(err.stack)
    sessionData.errorsEncountered++
    sessionData.lastError = err.message
    saveSessionData()
    // Don't exit, keep running
})

process.on('unhandledRejection', function (err) {
    console.log(chalk.red('⚠️ Unhandled Rejection:', err.message))
    sessionData.errorsEncountered++
    sessionData.lastError = err.message
    // Don't exit, keep running
})

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n👋 Gracefully shutting down...'))
    console.log(chalk.cyan('📊 Final Session Stats:'))
    console.log(chalk.white(`   Messages: ${sessionData.messagesProcessed}`))
    console.log(chalk.white(`   Commands: ${sessionData.commandsExecuted}`))
    console.log(chalk.white(`   Errors: ${sessionData.errorsEncountered}`))
    saveSessionData()
    console.log(chalk.green('✅ Session data saved!\n'))
    process.exit(0)
})

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\n🛑 Received SIGTERM, shutting down...'))
    saveSessionData()
    process.exit(0)
})

// Keep process alive
process.stdin.resume()

// Periodic health check
setInterval(() => {
    const uptime = Math.floor((Date.now() - sessionData.startTime) / 1000)
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    
    console.log(chalk.cyan(`\n📊 Health Check - Uptime: $${hours}h$$ {minutes}m`))
    console.log(chalk.white(`   Messages: ${sessionData.messagesProcessed}`))
    console.log(chalk.white(`   Commands: ${sessionData.commandsExecuted}`))
    console.log(chalk.white(`   Errors: ${sessionData.errorsEncountered}\n`))
}, 1800000) // Every 30 minutes

// Memory monitoring
setInterval(() => {
    const used = process.memoryUsage()
    const memoryMB = Math.round(used.heapUsed / 1024 / 1024)
    
    if (memoryMB > 500) {
        console.log(chalk.yellow(`⚠️ High memory usage: ${memoryMB}MB`))
        
        if (global.gc) {
            console.log(chalk.cyan('🧹 Running garbage collection...'))
            global.gc()
        }
    }
}, 600000) // Every 10 minutes

// Auto-restart on critical errors (optional)
let criticalErrorCount = 0
const MAX_CRITICAL_ERRORS = 5

process.on('warning', (warning) => {
    console.log(chalk.yellow('⚠️ Warning:', warning.name))
    console.log(chalk.yellow('Message:', warning.message))
})

// Monitor for hanging processes
let lastMessageTime = Date.now()
setInterval(() => {
    const timeSinceLastMessage = Date.now() - lastMessageTime
    
    // If no activity for 30 minutes, log it
    if (timeSinceLastMessage > 1800000) {
        console.log(chalk.yellow(`⚠️ No activity for ${Math.floor(timeSinceLastMessage/60000)} minutes`))
    }
}, 600000)

console.log(chalk.green('\n✅ All systems initialized and running!\n'))
console.log(chalk.cyan('═══════════════════════════════════════'))
console.log(chalk.white('Bot is ready to receive messages'))
console.log(chalk.white('Press Ctrl+C to stop the bot'))
console.log(chalk.cyan('═══════════════════════════════════════\n'))
