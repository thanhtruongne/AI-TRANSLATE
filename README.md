# AI Voice Translator

A real-time voice translation application that uses OpenAI's APIs for speech-to-text, text translation, and text-to-speech capabilities.

## Features

- Voice recording and transcription using OpenAI's Whisper API
- Text translation using GPT-3.5-turbo
- Text-to-speech playback using OpenAI's TTS API
- Support for multiple languages
- Modern Material-UI interface
- Real-time audio processing

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- FFmpeg (for audio processing)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-voice-translator.git
cd ai-voice-translator
```

2. Install dependencies for both server and client:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create a `.env` file in the server directory:
```env
OPENAI_API_KEY=your_api_key_here
PORT=5000
```

## Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. In a new terminal, start the client:
```bash
cd client
npm start
```

3. Open http://localhost:3000 in your browser

## Usage

1. Click "Start Recording" to record your voice
2. Speak in your desired language
3. Click "Stop Recording" to process the audio
4. The transcribed text will appear in the input field
5. Select your target language
6. Click "Translate" to get the translation
7. Click "Play Translation" to hear the translated text

## Supported Languages

- English (en)
- Vietnamese (vi)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Korean (ko)
- And more...

## Technologies Used

- React
- TypeScript
- Material-UI
- Express.js
- OpenAI API
- FFmpeg
- Web Audio API

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 