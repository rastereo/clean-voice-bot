<div align="center">
  <img src="https://i.ibb.co/P6PmdD9/clean-Voice-Bot.png" alt="logo" border="0" width="150px" />
</div>

# cleanVoiceBot

cleanVoiceBot is a [Telegram bot](https://core.telegram.org/bots/api) that helps you remove background noise from audio files. It's easy to use — just send or forward an audio file to the bot, and it will return a cleaned version. The bot supports different audio formats for your convenience.

## 🔧Installation

To get started with the project, ensure that you have [Node.js](https://nodejs.org/en) installed. Then, clone this repository and install the dependencies:

```bash
git clone https://github.com/rastereo/cleanVoiceBot.git
cd clean-voice-bot
npm install
```

**Installing FFmpeg on Linux**

[FFmpeg](https://www.ffmpeg.org/) is required to run this script and can typically be installed on most Linux distributions using a package manager:

```bash
sudo apt update
sudo apt install ffmpeg
```

Ensure that FFmpeg is installed and accessible in your system's PATH, so your Node.js script can execute FFmpeg commands successfully.

## 🌍Environment Variables

The project utilizes several environment variables for configuration. These should be defined in a `.env` file at the root of your project. Below is a description of each variable:

- `BOT_KEY`: API key for the Telegram bot in a production environment.

- `DEV_BOT_KEY`: API key for the Telegram bot in a development environment.

- `ELEVENLABS_API_KEY`: API key for [ElevenLabs](https://elevenlabs.io/).

- `FILE_URL`: URL for accessing files that the bot will process.

- `API_ROOT`: Base URL for the API the bot interacts with.

- `GATE_MAX_DURATION`: Maximum allowed audio file duration (in seconds) for processing.

- `GATE_MIN_DURATION`: Minimum allowed audio file duration (in seconds) for processing.

- `RESULTS_DIR_NAME`: Directory name for storing processed file results.

- `ADMIN_ID`: Telegram ID of the administrator for notifications or special access.

## ⚙️Scripts

To start the bot in production mode:

```bash
npm run build
npm run start
```

For development:

```bash
npm run dev
```

🤖 Technologies

The project leverages the following technologies:

- [grammY](https://grammy.dev/)
- [ElevenLabs JS](https://github.com/elevenlabs/elevenlabs-js?tab=readme-ov-file#elevenlabs-js-library)
- [FFmpeg](https://www.ffmpeg.org/)
- [TypeScript](https://www.typescriptlang.org/)

## 🎁Support

Consider supporting the project on [Boosty](https://boosty.to/cleanvoicebot/donate). Your contributions help keep the service running.
