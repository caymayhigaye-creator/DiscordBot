const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.content.startsWith('.rprofile')) return;

    const args = msg.content.split(' ');
    const target = args[1];
    if (!target) return msg.reply('Usage: `.rprofile <username/userid>`');

    try {
        let userId = target;

        // 1. ID mi yoksa Username mi olduğunu kontrol et ve ID'yi al
        if (isNaN(target)) {
            const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [target],
                excludeBannedUsers: false
            });
            if (!userRes.data.data || userRes.data.data.length === 0) return msg.reply('User not found!');
            userId = userRes.data.data[0].id;
        }

        // 2. Verileri çek
        const [infoRes, thumbRes] = await Promise.all([
            axios.get(`https://users.roblox.com/v1/users/${userId}`),
            axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
        ]);

        const data = infoRes.data;
        const avatarUrl = thumbRes.data.data[0].imageUrl;

        // 3. Rolimons verisini ayrı dene (hata alsa bile profil görünsün)
        let rap = "N/A", value = "N/A", topItems = "Private or None";
        try {
            const roliRes = await axios.get(`https://api.rolimons.com/players/v1/playerinfo/${userId}`);
            if (roliRes.data.success) {
                rap = roliRes.data.value ? roliRes.data.value.toLocaleString() : "0";
                value = roliRes.data.rank ? roliRes.data.rank.toLocaleString() : "0";
                topItems = roliRes.data.inventory_name_list ? roliRes.data.inventory_name_list.slice(0, 3).join(', ') : "None";
            }
        } catch (e) { console.log("Rolimons API unreachable"); }

        // 4. Embed Hazırla
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${data.displayName} (@${data.name})`)
            .setThumbnail(avatarUrl)
            .setURL(`https://www.roblox.com/users/${userId}/profile`)
            .addFields(
                { name: 'User ID', value: `\`${userId}\``, inline: true },
                { name: 'Join Date', value: new Date(data.created).toLocaleDateString(), inline: true },
                { name: 'RAP', value: `\`${rap}\``, inline: true },
                { name: 'Value', value: `\`${value}\``, inline: true },
                { name: 'Notable Items', value: topItems, inline: false }
            )
            .setFooter({ text: 'Roblox & Rolimons Data' });

        msg.reply({ embeds: [embed] });

    } catch (e) {
        console.error("HATA:", e.response ? e.response.data : e.message);
        msg.reply('Error: Could not fetch data. Make sure the username is correct.');
    }
});

client.login(process.env.DISCORD_TOKEN);
