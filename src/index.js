const { Readable, Writable } = require('stream'); // built-in
const wav = require('wav'); // built-in
const EventEmitter = require('events'); // built-in
const vosk = require('vosk');
const ffmpeg = require('fluent-ffmpeg');
const lame = require('@suldashi/lame');

class STTOutputEmitter extends EventEmitter {};
let STTEmitter;

let config = {};
let model;
let listeningList = {};
const { isConfigValid } = require('./util/validator');

/**
 * Set the module options.
 * @param {Object} opt Options to set for the module.
 */
function setup(opt) {
    const isConfigValidResult = isConfigValid(opt);
    if (isConfigValidResult !== true) {
        throw new Error(`Options are invalid! ${isConfigValidResult[0].message}`);
    }
    config = opt;
    vosk.setLogLevel(config.voskLogLevel);
    model = new vosk.Model(config.modelPath || process.cwd() + '/model');

    STTEmitter = new STTOutputEmitter();
    return STTEmitter;
};

/**
 * Start listening a user and return true on success.
 * @param {number|string} userId Discord user ID
 * @param {object} connection Voice channel connection
 */
function startListeningUser(userId, connection) {
    if (listeningList[userId]) {
        return "WARN_ALREADY_LISTENING";
    }

    const rec = new vosk.Recognizer({ model, sampleRate: 16000.0 });
    const wavReader = new wav.Reader();

    wavReader.on('format', async ({ audioFormat, sampleRate, channels }) => {
        if (audioFormat != 1 || channels != 1) {
            throw new Error("Audio data must be WAV format mono PCM.");
        }
        for await (const data of new Readable().wrap(wavReader)) {
            const end_of_speech = rec.acceptWaveform(data);
            if (end_of_speech) {
                const res = rec.result();
                if (res.text) STTEmitter.emit('recognition', userId, res.text);
            }
        }
        console.log("FINAL RESULT OF", userId, rec.finalResult(rec));
        rec.free();
    });

    const PCMToMP3 = new lame.Encoder({
        // input: PCM STEREO
        channels: 2,
        bitDepth: 16,
        sampleRate: 48000,

        // output: MP3 MONO
        bitRate: 128,
        outSampleRate: 16000,
        mode: lame.MONO // Vosk only supports MONO!
    });

    
    const discordAudio = connection.receiver.createStream(userId, { mode: 'pcm', end: 'manual' });
    listeningList[userId] = {discordAudio,PCMToMP3,wavReader,rec,connection};

    const waveStream = ffmpeg() // PCMToMP3 (lame.Encoder) MONO MP3 > WAV (waveStream)
        .input(PCMToMP3)
        .toFormat('wav')
        .on('error', (err) => {
            console.log('PCM > WAV, An error occurred for user', userId,err.message);
        })
        // .on('progress', (progress) => {
        //     // console.log(JSON.stringify(progress));
        //     // console.log('PCM > WAV, Processing: ' + progress.targetSize + ' KB converted');
        // })
        .on('end', () => {
            listeningList[userId] = undefined;
        });

    waveStream.pipe(wavReader, { 'highWaterMark': 4096 }); // WAV (waveStream) > wavReader (wav pre-processor for Vosk)
    discordAudio.pipe(PCMToMP3, { 'highWaterMark': 4096 }); // Discord STEREO PCM > PCMToMP3 (lame.Encoder) > MONO MP3

    // PCM > MP3 > WAV > Vosk > Text
    return true;
}

/**
 * Stop listening a user.
 * @param {number|string} userId Discord user ID
 * @param {object} connection Voice channel connection
 */
function stopListeningUser(userId) {
    if (!listeningList[userId]) {
        return "WARN_NOT_LISTENING_ALREADY";
    }

    listeningList[userId].discordAudio.end();
    listeningList[userId] = undefined;
    return true;
}

exports.setup = setup;
exports.startListeningUser = startListeningUser;
exports.stopListeningUser = stopListeningUser;