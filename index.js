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
    if (msg.author.bot) return;

    // .rprofile command
    if (msg.content.startsWith('.rprofile')) {
        const args = msg.content.split(' ');
        const target = args[1];

        if (!target) return msg.reply('Usage: `.rprofile <username/userid>`');

        try {
            let userId = target;

            // Resolve Username to ID if input is not a number
            if (isNaN(target)) {
                const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                    usernames: [target],
                    excludeBannedUsers: false
                });
                if (userRes.data.data.length === 0) return msg.reply('User not found on Roblox!');
                userId = userRes.data.data[0].id;
            }

            // Fetch Profile Data
            const infoRes = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
            const data = infoRes.data;

            // Fetch Avatar Thumbnail (Headshot)
            const thumbRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
            const avatarUrl = thumbRes.data.data[0]?.imageUrl || "";

            // Create English Embed
            const profileEmbed = new EmbedBuilder()
                .setColor('#2F3136') // Dark industrial theme
                .setTitle(`${data.displayName} (@${data.name})`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setThumbnail(avatarUrl)
                .addFields(
                    { name: 'User ID', value: `\`${data.id}\``, inline: true },
                    { name: 'Joined Date', value: new Date(data.created).toLocaleDateString('en-US'), inline: true },
                    { name: 'About', value: data.description || 'No description provided.' }
                )
                .setFooter({ text: 'Roblox Profile Lookup' })
                .setTimestamp();

            msg.reply({ embeds: [profileEmbed] });

        } catch (error) {
            console.error(error);
            msg.reply('An error occurred while fetching user data.');
        }
    }
});


if (!process.env.DISCORD_TOKEN) {
    console.error("ERROR: DISCORD_TOKEN is not defined in Railway Variables!");
} else {
    client.login(process.env.DISCORD_TOKEN).catch(err => {
        console.error("Login failed:", err.message);
    });
}
