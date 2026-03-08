const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { EmbedBuilder } = require('discord.js'); // Embed için gerekli

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.content.startsWith('.rprofile')) return;

    const target = msg.content.split(' ')[1];
    if (!target) return msg.reply('Usage: `.rprofile <username/userid>`');

    try {
        // 1. Kullanıcıyı Bul
        let userId = target;
        if (isNaN(target)) {
            const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', { usernames: [target] });
            if (!userRes.data.data || userRes.data.data.length === 0) return msg.reply('User not found!');
            userId = userRes.data.data[0].id;
        }

        // 2. Verileri Çek
        const [infoRes, thumbRes] = await Promise.all([
            axios.get(`https://users.roblox.com/v1/users/${userId}`),
            axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
        ]);

        const data = infoRes.data;
        const avatarUrl = thumbRes.data.data[0].imageUrl;

        // 3. Rolimons'dan Veri Çek (Doğru API Yolu)
        let rap = "N/A", value = "N/A", topItems = "None";
        try {
            // Rolimons verileri 'data' objesinin içindedir
            const roliRes = await axios.get(`https://api.rolimons.com/players/v1/playerinfo/${userId}`);
            if (roliRes.data.success) {
                const p = roliRes.data;
                rap = p.rap ? p.rap.toLocaleString() : "0";
                value = p.value ? p.value.toLocaleString() : "0";
                topItems = p.inventory_name_list ? p.inventory_name_list.slice(0, 3).join(', ') : "None";
            }
        } catch (e) { console.log("Rolimons API error"); }

        // 4. Embed ile Göster
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
        console.error(e);
        msg.reply('Error: Could not fetch profile.');
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.content.startsWith('.lovezugii')) return;

    const targetId = "1453417168489418925"; // Discord User ID

    try {
        // 1. Kullanıcıyı çek
        const user = await client.users.fetch(targetId);
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 512 });
        const username = user.username;

        // 2. Embed tasarımı
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`Seni çok seviyorum ${username}! ❤️`)
            .setThumbnail(avatarUrl);

        // 3. Güvenli spam (10 kez, 1 saniye arayla)
        let count = 0;
        const interval = setInterval(() => {
            if (count >= 10) {
                clearInterval(interval);
                return;
            }
            msg.channel.send({ embeds: [embed] });
            count++;
        }, 1200); // Discord'un banlamaması için 1.2 saniye yaptım

    } catch (e) {
        msg.reply("Bu ID'ye sahip bir kullanıcıyı çekemedim. Botun o kişiyi görmesi gerekiyor.");
    }
});

client.login(process.env.DISCORD_TOKEN);
