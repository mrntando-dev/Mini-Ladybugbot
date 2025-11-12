const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Global state
let pairingCode = null;
let qrCode = null;
let botInstance = null;
let connectionStatus = 'disconnected';
let pairingNumber = null;

// Create necessary directories
const dirs = ['./session', './public', './all'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Create a simple HTML page
const createHTMLPage = () => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ladybug WhatsApp Bot - Pairing</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }
        
        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2em;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        
        .status {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        
        .status.disconnected {
            background: #fee;
            color: #c33;
        }
        
        .status.connecting {
            background: #ffeaa7;
            color: #fdcb6e;
        }
        
        .status.connected {
            background: #dfe;
            color: #2d3;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            transition: border 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .qr-container {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        #qrcode {
            max-width: 100%;
            height: auto;
        }
        
        .pairing-code {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 5px;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .instructions {
            text-align: left;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .instructions h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .instructions ol {
            margin-left: 20px;
        }
        
        .instructions li {
            margin: 10px 0;
            color: #666;
        }
        
        .footer {
            margin-top: 30px;
            color: #666;
            font-size: 0.9em;
        }
        
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐞 Ladybug Bot</h1>
        <p class="subtitle">WhatsApp Bot Pairing System</p>
        
        <div id="status" class="status disconnected">
            ⚫ Disconnected
        </div>
        
        <div id="pairingSection">
            <div class="input-group">
                <input 
                    type="tel" 
                    id="phoneNumber" 
                    placeholder="Enter WhatsApp Number (e.g., 263718456744)"
                    maxlength="15"
                />
            </div>
            <button id="pairBtn" onclick="requestPairing()">
                Get Pairing Code
            </button>
            <button id="qrBtn" onclick="requestQR()" style="margin-top: 10px; background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);">
                Show QR Code
            </button>
        </div>
        
        <div id="codeDisplay" style="display: none;">
            <div class="pairing-code" id="pairingCode"></div>
            <div class="instructions">
                <h3>📱 How to Connect:</h3>
                <ol>
                    <li>Open WhatsApp on your phone</li>
                    <li>Tap <strong>Menu</strong> or <strong>Settings</strong></li>
                    <li>Tap <strong>Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li>Enter the code shown above</li>
                </ol>
            </div>
        </div>
        
        <div id="qrDisplay" style="display: none;">
            <div class="qr-container">
                <img id="qrcode" alt="QR Code" />
            </div>
            <div class="instructions">
                <h3>📱 Scan QR Code:</h3>
                <ol>
                    <li>Open WhatsApp on your phone</li>
                    <li>Tap <strong>Menu</strong> or <strong>Settings</strong></li>
                    <li>Tap <strong>Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li>Point your phone at the QR code</li>
                </ol>
            </div>
        </div>
        
        <div class="footer">
            <p>Created by ntandomods | WhatsApp: 263718456744</p>
        </div>
    </div>
    
    <script>
        // Check status every 3 seconds
        setInterval(checkStatus, 3000);
        checkStatus();
        
        async function checkStatus() {
            try {
                const response = await fetch('/status');
                const data = await response.json();
                
                const statusDiv = document.getElementById('status');
                statusDiv.className = 'status ' + data.status;
                
                switch(data.status) {
                    case 'connected':
                        statusDiv.innerHTML = '🟢 Connected & Running';
                        document.getElementById('pairingSection').style.display = 'none';
                        document.getElementById('codeDisplay').style.display = 'none';
                        document.getElementById('qrDisplay').style.display = 'none';
                        break;
                    case 'connecting':
                        statusDiv.innerHTML = '🟡 Connecting...';
                        break;
                    default:
                        statusDiv.innerHTML = '⚫ Disconnected';
                        document.getElementById('pairingSection').style.display = 'block';
                }
            } catch (error) {
                console.error('Error checking status:', error);
            }
        }
        
        async function requestPairing() {
            const phoneNumber = document.getElementById('phoneNumber').value.replace(/[^0-9]/g, '');
            
            if (!phoneNumber || phoneNumber.length < 10) {
                alert('Please enter a valid phone number with country code');
                return;
            }
            
            const btn = document.getElementById('pairBtn');
            btn.disabled = true;
            btn.innerHTML = '<div class="loader"></div>';
            
            try {
                const response = await fetch('/pair', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('pairingCode').textContent = data.code;
                    document.getElementById('codeDisplay').style.display = 'block';
                    document.getElementById('pairingSection').style.display = 'none';
                    document.getElementById('qrDisplay').style.display = 'none';
                } else {
                    alert('Error: ' + data.message);
                    btn.disabled = false;
                    btn.innerHTML = 'Get Pairing Code';
                }
            } catch (error) {
                alert('Error requesting pairing code');
                btn.disabled = false;
                btn.innerHTML = 'Get Pairing Code';
            }
        }
        
        async function requestQR() {
            const btn = document.getElementById('qrBtn');
            btn.disabled = true;
            btn.innerHTML = '<div class="loader"></div>';
            
            try {
                const response = await fetch('/qr');
                const data = await response.json();
                
                if (data.success && data.qr) {
                    document.getElementById('qrcode').src = data.qr;
                    document.getElementById('qrDisplay').style.display = 'block';
                    document.getElementById('pairingSection').style.display = 'none';
                    document.getElementById('codeDisplay').style.display = 'none';
                } else {
                    alert('Error: ' + data.message);
                    btn.disabled = false;
                    btn.innerHTML = 'Show QR Code';
                }
            } catch (error) {
                alert('Error requesting QR code');
                btn.disabled = false;
                btn.innerHTML = 'Show QR Code';
            }
        }
    </script>
</body>
</html>
    `;
    
    fs.writeFileSync('./public/index.html', html);
};

// API Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status', (req, res) => {
    res.json({ 
        status: connectionStatus,
        paired: pairingNumber !== null,
        uptime: process.uptime()
    });
});

app.post('/pair', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.json({ success: false, message: 'Phone number is required' });
        }
        
        pairingNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        // Start bot with pairing
        if (!botInstance) {
            startBot(true, pairingNumber);
        }
        
        // Wait for pairing code
        let attempts = 0;
        while (!pairingCode && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        if (pairingCode) {
            res.json({ success: true, code: pairingCode });
        } else {
            res.json({ success: false, message: 'Timeout waiting for pairing code' });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

app.get('/qr', async (req, res) => {
    try {
        if (!botInstance) {
            startBot(false);
        }
        
        // Wait for QR code
        let attempts = 0;
        while (!qrCode && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        if (qrCode) {
            res.json({ success: true, qr: qrCode });
        } else {
            res.json({ success: false, message: 'Timeout waiting for QR code' });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

async function startBot(usePairing = false, phoneNumber = null) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();
        
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: ['Ladybug Bot', 'Safari', '4.0.0'],
            markOnlineOnConnect: true,
        });
        
        botInstance = sock;
        
        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr && !usePairing) {
                qrCode = await QRCode.toDataURL(qr);
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                
                connectionStatus = 'disconnected';
                botInstance = null;
                pairingCode = null;
                qrCode = null;
                
                if (shouldReconnect) {
                    setTimeout(() => startBot(usePairing, phoneNumber), 3000);
                }
            } else if (connection === 'open') {
                console.log('✅ Bot connected successfully!');
                connectionStatus = 'connected';
                
                // Start the main bot script
                require('./index.js');
            } else if (connection === 'connecting') {
                connectionStatus = 'connecting';
            }
        });
        
        // Handle pairing code
        if (usePairing && phoneNumber && !sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(phoneNumber);
                    pairingCode = code;
                    console.log(`Pairing Code: ${code}`);
                } catch (error) {
                    console.error('Error requesting pairing code:', error);
                }
            }, 3000);
        }
        
    } catch (error) {
        console.error('Error starting bot:', error);
        connectionStatus = 'disconnected';
        setTimeout(() => startBot(usePairing, phoneNumber), 5000);
    }
}

// Create HTML page
createHTMLPage();

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
    console.log(`📱 Open the URL to pair your WhatsApp`);
});

// Auto-start bot if already authenticated
setTimeout(() => {
    if (fs.existsSync('./session/creds.json')) {
        console.log('📱 Existing session found, starting bot...');
        startBot(false);
    }
}, 2000);
