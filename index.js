const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.once('ready', () => {
    console.log(`Bot is online and ready!`);
});


client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.content.startsWith('.rprofile')) return;

    const args = msg.content.split(' ');
    const target = args[1];

    if (!target) return msg.reply('Usage: `.rprofile <username/userid>`');

    try {
        let userId = target;

        // 1. Username girildiyse ID'ye çevir
        if (isNaN(target)) {
            const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [target],
                excludeBannedUsers: false
            });
            if (userRes.data.data.length === 0) return msg.reply('User not found!');
            userId = userRes.data.data[0].id;
        }

        // 2. Roblox Bilgilerini Çek
        const infoRes = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        const data = infoRes.data;

        // 3. Rolimons'dan Ekonomi (RAP) Verilerini Çek
        let rap = "Private/N/A";
        let topItems = "None";
        try {
            const rolimonsRes = await axios.get(`https://api.rolimons.com/players/v1/playerinfo/${userId}`);
            if (rolimonsRes.data.success) {
                rap = rolimonsRes.data.value.toLocaleString();
                // Envanterdeki ilk 3 öğeyi al
                topItems = rolimonsRes.data.inventory_name_list ? rolimonsRes.data.inventory_name_list.slice(0, 3).join(', ') : "None";
            }
        } catch (err) {
            console.log("Rolimons data unavailable.");
        }

        // 4. Embed Tasarımı
        const profileEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${data.displayName} (@${data.name})`)
            .setURL(`https://www.roblox.com/users/${userId}/profile`)
            .addFields(
                { name: 'User ID', value: `\`${userId}\``, inline: true },
                { name: 'Join Date', value: new Date(data.created).toLocaleDateString('en-US'), inline: true },
                { name: 'RAP (Rolimons)', value: `\`${rap}\``, inline: true },
                { name: 'Notable Items', value: topItems, inline: false },
                { name: 'About', value: data.description || 'No description.' }
            )
            .setTimestamp();

        msg.reply({ embeds: [profileEmbed] });

    } catch (error) {
        msg.reply('An error occurred while fetching the profile.');
    }
});

if (!process.env.DISCORD_TOKEN) {
    console.error("ERROR: DISCORD_TOKEN is not defined in Railway Variables!");
} else {
    client.login(process.env.DISCORD_TOKEN).catch(err => {
        console.error("Login failed:", err.message);
    });
}
