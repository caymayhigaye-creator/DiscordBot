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

    const target = msg.content.split(' ')[1];
    if (!target) return msg.reply('Usage: `.rprofile <username/userid>`');

    try {
        // 1. ID'yi Çöz
        let userId = target;
        if (isNaN(target)) {
            const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', { usernames: [target] });
            if (userRes.data.data.length === 0) return msg.reply('User not found!');
            userId = userRes.data.data[0].id;
        }

        // 2. Verileri Paralel Çek (Hız için)
        const [infoRes, thumbRes, roliRes] = await Promise.all([
            axios.get(`https://users.roblox.com/v1/users/${userId}`),
            axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`),
            axios.get(`https://api.rolimons.com/players/v1/playerinfo/${userId}`).catch(() => ({ data: null }))
        ]);

        const data = infoRes.data;
        const avatarUrl = thumbRes.data.data[0].imageUrl;
        const roliData = roliRes.data;

        // 3. Embed Oluştur
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`${data.displayName} (@${data.name})`)
            .setThumbnail(avatarUrl)
            .setURL(`https://www.roblox.com/users/${userId}/profile`)
            .addFields(
                { name: 'User ID', value: `\`${userId}\``, inline: true },
                { name: 'Join Date', value: new Date(data.created).toLocaleDateString(), inline: true },
                { name: 'RAP', value: roliData ? `\`${roliData.value.toLocaleString()}\`` : 'N/A', inline: true },
                { name: 'Value', value: roliData ? `\`${roliData.rank.toLocaleString()}\`` : 'N/A', inline: true },
                { name: 'Premium', value: data.isBanned ? 'Yes' : 'No', inline: true }, // Not: Banned değil Premium durumu
                { name: 'Top Items', value: roliData && roliData.inventory_name_list ? roliData.inventory_name_list.slice(0, 5).join(', ') : 'Private or None' }
            )
            .setFooter({ text: 'Roblox & Rolimons Data' });

        msg.reply({ embeds: [embed] });

    } catch (e) {
        msg.reply('Error fetching profile. Check if username is correct.');
    }
});

if (!process.env.DISCORD_TOKEN) {
    console.error("ERROR: DISCORD_TOKEN is not defined in Railway Variables!");
} else {
    client.login(process.env.DISCORD_TOKEN).catch(err => {
        console.error("Login failed:", err.message);
    });
}
