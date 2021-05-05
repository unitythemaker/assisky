const secrets = require('./config/secret.json');
const { prefix } = require('./config/config.json');

const Assisky = require('../dist');
const STTEmitter = Assisky.setup({
    voskLogLevel: -1,
    // modelPath: "model",
});

STTEmitter.on('recognition', (userId, result) => {
    console.log(userId, result);
});

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        message.channel.send('Pong.');
    } else if (command === 'listen') {
        if (message.member.voice.channel) {
            (async () => {
                const connection = await message.member.voice.channel.join();
                const listenResult = Assisky.startListeningUser(message.author.id, connection);
                if (listenResult === 'WARN_ALREADY_LISTENING') message.reply('The recognition was already started!');
                else if (listenResult === true) message.reply('Recognition started.');
            })();
        } else {
            message.reply('Join a VC first!');
        }
    }
});

client.login(secrets.token);