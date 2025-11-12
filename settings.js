/*

  !- ©ᴍᴀʟᴠɪɴ-dev
  https://wa.me/263714757857
  
*/

require("./all/module.js")
//========== Setting ==========//
global.doc1 = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
global.doc2 = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
global.doc3 = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
global.doc5 = 'application/pdf'
global.doc6 = 'application/vnd.android.package-archive'
////////////////////////////////////////////////

global.tumb = ["https://limewire.com/d/GkZlB#ocje9roWOx", "https://limewire.com/d/GkZlB#ocje9roWOx", "https://limewire.com/d/GkZlB#ocje9roWOx", "https://limewire.com/d/GkZlB#ocje9roWOx", "https://limewire.com/d/GkZlB#ocje9roWOx", "https://limewire.com/d/GkZlB#ocje9roWOx"]

global.owner = ["263718456744"]  
global.saluran = "120363@newsletter"
global.idgc = "120322@g.us" 

global.tokenVercel = "_" //Token vercel mu (search vercel token)
global.tokenGithub = "_" // Token github mu (search github token)
global.usnGithub = "_" // Nama akun gtihub mu

global.botname = "Ladybug-Mods" ///setting nama bot
global.ownername = 'ntandomods'
global.ownerNumber = ["263718456744@s.whatsapp.net"] 
global.wagc = "https://chat.whatsapp.com/HD7wcOaEINYKG9?mode=ac_t" 
global.wm = "ntandomode-developers。" 
global.wmbot = "Ladybug-Mods" 
global.packname = ""
global.author = "• Ntandomods"
global.prefa = ['','!','.','#','&']
global.typemenu = "button" //button, payment, polling, product

//-+++-//
global.public = true /// true = hidup/on  /// false = mati/of
global.welcome = true
global.readchat = true

//messages
global.mess = {
    success: '✓ 🅂🅄🄲🄲🄴🅂\nSuccess! `>//<`',
    admin: '∅ 🄰🄲🄲🄴🅂 🄳🄴🄽🄸🄴🄳\nThis feature is only for group admins.',
    botAdmin: '∅ 🄰🄲🄲🄴🅂 🅁🄴🅀🅄🄸🅁🄴🄳\nThe bot must be an admin to use this feature.',
    owner: '∅ 🄰🄲🄲🄴🅂 🄳🄴🄽🄸🄴🄳\nYou are not the Owner!',
    group: '∅ 🄰🄲🄲🄴🅂 🅁🄴🅂🅃🅁🄸🅃🄲🅃🄴🄳\nThis feature can only be used in group chats.',
    private: '∅ 🄰🄲🄲🄴🅂 🅁🄴🅂🅃🅁🄸🅃🄲🅃🄴🄳\nThis feature can only be used in private chat.',
    wait: '🅟🅛🅔🅐🅢🅔 🅦🅐🅘🅣'
}


let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update'${__filename}'`))
    delete require.cache[file]
    require(file)
})
