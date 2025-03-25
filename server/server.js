const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'zh', 'ar', 
  'hi', 'pt', 'nl', 'tr', 'vi'
];


// Translate text route
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please check your .env file.' 
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
    });
    
    res.json({ translation: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Translation error:', error);
    
    // Handle specific OpenAI API errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        error: 'OpenAI API quota exceeded. Please check your billing details.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please check your .env file.' 
      });
    }

    res.status(500).json({ 
      error: 'Translation failed. Please try again later.' 
    });
  }
});

// Text to Speech route
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, language } = req.body;

    // Tạo giọng nói từ văn bản
    const speechFile = path.resolve('./speech.mp3');
    
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova", // Có thể chọn giọng khác: alloy, echo, fable, onyx, nova, shimmer
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    // Đọc file và chuyển thành base64
    const audioBase64 = fs.readFileSync(speechFile, { encoding: 'base64' });

    // Xóa file tạm
    fs.unlinkSync(speechFile);

    res.json({ audioBase64 });

  } catch (error) {
    console.error('Lỗi chuyển văn bản thành giọng nói:', error);
    res.status(500).json({ error: 'Lỗi xử lý giọng nói' });
  }
});


app.post('/api/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    // Kiểm tra file upload
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file âm thanh' });
    }

    // Chuyển đổi file âm thanh sang định dạng phù hợp
    const inputPath = req.file.path;
    const outputPath = path.join('uploads', `${req.file.filename}.wav`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Đọc file âm thanh
    const audioFile = fs.readFileSync(outputPath);
    const audioBase64 = audioFile.toString('base64');

    // Gọi API OpenAI Whisper để chuyển đổi giọng nói
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "whisper-1",
      language: "en" // Có thể thay đổi ngôn ngữ
    });

    // Dọn dẹp file tạm
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    res.json({
      text: transcription.text,
      originalLanguage: transcription.language
    });

  } catch (error) {
    console.error('Lỗi chuyển đổi giọng nói:', error);
    res.status(500).json({ error: 'Lỗi xử lý giọng nói' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 