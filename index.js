const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.content.startsWith('.rprofile')) return;

    const target = msg.content.split(' ')[1];
    if (!target) return msg.reply('Usage: `.rprofile <username/userid>`');

    try {
        let userId = target;
        if (isNaN(target)) {
            const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', { usernames: [target] });
            if (!userRes.data.data || userRes.data.data.length === 0) return msg.reply('User not found!');
            userId = userRes.data.data[0].id;
        }

        // İstekleri ayrı ayrı yapalım ki biri hata verirse diğeri çalışmaya devam etsin
        const infoRes = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        const thumbRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`);
        
        let roliData = null;
        try {
            const roliRes = await axios.get(`https://api.rolimons.com/players/v1/playerinfo/${userId}`);
            roliData = roliRes.data; // DÜZELTME: .data demene gerek yok, direk veriyi alıyoruz
        } catch (e) { roliData = null; }

        const data = infoRes.data;
        const avatarUrl = thumbRes.data.data[0].imageUrl;

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`${data.displayName} (@${data.name})`)
            .setThumbnail(avatarUrl)
            .setURL(`https://www.roblox.com/users/${userId}/profile`)
            .addFields(
                { name: 'User ID', value: `\`${userId}\``, inline: true },
                { name: 'Join Date', value: new Date(data.created).toLocaleDateString(), inline: true },
                { name: 'RAP', value: roliData && roliData.success ? `\`${roliData.value.toLocaleString()}\`` : 'N/A', inline: true },
                { name: 'Value', value: roliData && roliData.success ? `\`${roliData.rank.toLocaleString()}\`` : 'N/A', inline: true },
                { name: 'Premium', value: data.isBanned ? 'Yes' : 'No', inline: true },
                { name: 'Notable Items', value: roliData && roliData.inventory_name_list ? roliData.inventory_name_list.slice(0, 3).join(', ') : 'Private or None' }
            )
            .setFooter({ text: 'Roblox & Rolimons Data' });

        msg.reply({ embeds: [embed] });

    } catch (e) {
        console.error(e); // Hatanın ne olduğunu konsolda görebilmen için
        msg.reply('Error fetching profile. Check if username is correct or try again later.');
    }
});

client.login(process.env.DISCORD_TOKEN);
