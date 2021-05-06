# assisky
A Discord Speech-to-Text module made with Vosk. Yes, it works!

# Installation
1. Download a model. [You can click here to find models.](https://alphacephei.com/vosk/models)
2. Extract the zip file to a folder.
3. Rename the folder as "model" and put it in the root of your project or a path you want.
4. If you put the model folder at a custom path then edit the model path in the code.
5. Install ffmpeg. (``apt install ffmpeg`` for Ubuntu)
6. Install this npm module with ``npm i assisky``

# API
## Assisky.setup(options)
**options:**
```jsonc
{
    "voskLogLevel": int, // -1 to disable logging of Vosk
    "modelPath": "Path to downloaded model folder", // Default: ./model
}
```

## Assisky.startListeningUser(userId, discordVoiceConnection)
**userId**: A Discord user ID that joined to a voice channel.
<br />

**discordVoiceConnection**: The voice connection of the bot. (Bot should join the same VC with the user.) [See this for more details.](https://discordjs.guide/voice/)

## Assisky.stopListeningUser(userId)
**userId**: A Discord user ID that joined to a voice channel and recognition for user has been started and progressing.

# Example
[Inspect the example folder.](./example/index.js)