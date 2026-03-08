const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.once('ready', () => {
    console.log(`${client.user.tag} aktif!`);
});

client.on('messageCreate', msg => {
    if (msg.content === '!selam') {
        msg.reply('Selam zugiis, bot çalışıyor! 🚀');
    }
});

client.login(process.env.DISCORD_TOKEN);
