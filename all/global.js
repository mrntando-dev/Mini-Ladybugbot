// Global configuration
global.owner = ['263718456744'];
global.prefix = '.';
global.packname = 'Ladybug Bot';
global.author = 'ntandomods';
global.sessionName = 'session';
global.welcome = true;
global.autoread = false;
global.autoreadsw = true;
global.anticall = true;
global.public = true;

// API Configuration
global.APIs = {
    nrtm: 'https://nurutomo.herokuapp.com',
    xteam: 'https://api.xteam.xyz',
    zahir: 'https://zahirr-web.herokuapp.com',
    zeks: 'https://api.zeks.me',
    pencarikode: 'https://pencarikode.xyz',
    LeysCoder: 'https://leyscoders-api.herokuapp.com'
};

global.APIKeys = {
    'https://api.xteam.xyz': 'your-api-key',
    'https://zahirr-web.herokuapp.com': 'zahirgans',
    'https://api.zeks.me': 'apivinz',
    'https://pencarikode.xyz': 'pais',
    'https://leyscoders-api.herokuapp.com': 'MIMINGANZ'
};

// Limit configuration
global.limit = {
    free: 100,
    premium: 999,
    vip: 'Unlimited'
};

// Other settings
global.mess = {
    success: '✅ Success!',
    admin: '❗ This command is only for admins!',
    botAdmin: '❗ Bot must be an admin!',
    owner: '❗ This command is only for the owner!',
    group: '❗ This command can only be used in groups!',
    private: '❗ This command can only be used in private chat!',
    bot: '❗ This feature is only for the bot!',
    wait: '⏳ Please wait...',
    error: '❌ Error! Please try again.',
    endLimit: '❌ Your daily limit has run out!',
};

global.limitawal = {
    premium: "Infinity",
    free: 100
};

// Thumbnail
global.thumb = fs.existsSync('./media/image/thumb.jpg') ? fs.readFileSync('./media/image/thumb.jpg') : Buffer.from([]);

// Delay function
global.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Export all
module.exports = global;
