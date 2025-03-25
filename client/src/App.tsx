import { Mic, PlayArrow, Stop, Translate } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  styled,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useRef, useState } from 'react';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
})) as typeof Paper;

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
})) as typeof Button;

const TextDisplay = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  minHeight: '100px',
})) as typeof Paper;

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleAudioTranslation(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Failed to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioTranslation = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await axios.post('http://localhost:5000/api/audio-translate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOriginalText(response.data.text);
      handleTranslation(response.data.text);
    } catch (error: any) {
      console.error('Audio translation error:', error);
      setError(error.response?.data?.error || 'Failed to translate audio.');
    }
  };

  const handleTranslation = async (text: string) => {
    try {
      setError(null);
      const response = await axios.post('http://localhost:5000/api/translate', {
        text,
        targetLanguage,
      });
      setTranslatedText((response.data as { translation: string }).translation);
    } catch (error: any) {
      console.error('Translation error:', error);
      setError(error.response?.data?.error || 'Translation failed. Please try again.');
      setTranslatedText('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextTranslation = async () => {
    if (!originalText.trim()) {
      setError('Please enter text to translate');
      return;
    }
    setIsLoading(true);
    await handleTranslation(originalText);
  };

  const playTranslatedAudio = async () => {
    try {
      setError(null);
      const response = await axios.post('http://localhost:5000/api/text-to-speech', {
        text: translatedText,
        language: targetLanguage,
      });
      
      const audio = new Audio(`data:audio/mp3;base64,${response.data.audioBase64}`);
      audio.play();
    } catch (error: any) {
      console.error('Text to speech error:', error);
      setError(error.response?.data?.error || 'Failed to play audio. Please try again.');
    }
  };

  const handleSourceLanguageChange = (e: SelectChangeEvent) => {
    setSourceLanguage(e.target.value);
  };

  const handleTargetLanguageChange = (e: SelectChangeEvent) => {
    setTargetLanguage(e.target.value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOriginalText(e.target.value);
  };

  return (
    <Container maxWidth="md">
      <StyledPaper>
        <Typography variant="h4" gutterBottom align="center">
          AI Voice Translator
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>From Language</InputLabel>
              <Select
                value={sourceLanguage}
                label="From Language"
                onChange={handleSourceLanguageChange}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>To Language</InputLabel>
              <Select
                value={targetLanguage}
                label="To Language"
                onChange={handleTargetLanguageChange}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="center" mb={3}>
          <StyledButton
            variant="contained"
            color="primary"
            startIcon={isRecording ? <Stop /> : <Mic />}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </StyledButton>
        </Box>

        {isLoading && (
          <Box display="flex" justifyContent="center" mb={2}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box mb={2}>
            <Typography color="error" align="center">
              {error}
            </Typography>
          </Box>
        )}

        <TextDisplay>
          <Typography variant="h6" gutterBottom>
            Original Text:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={originalText}
            onChange={handleTextChange}
            placeholder="Enter text or use voice recording..."
            variant="outlined"
            margin="normal"
          />
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <StyledButton
              variant="contained"
              color="primary"
              startIcon={<Translate />}
              onClick={handleTextTranslation}
              disabled={!originalText.trim()}
            >
              Translate Text
            </StyledButton>
          </Box>
        </TextDisplay>

        <TextDisplay>
          <Typography variant="h6" gutterBottom>
            Translated Text:
          </Typography>
          <Typography>{translatedText}</Typography>
          {translatedText && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <StyledButton
                variant="contained"
                color="secondary"
                startIcon={<PlayArrow />}
                onClick={playTranslatedAudio}
              >
                Play Translation
              </StyledButton>
            </Box>
          )}
        </TextDisplay>
      </StyledPaper>
    </Container>
  );
}

export default App; 