import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  language?: string;
}

export class SpeechService {
  private static instance: SpeechService;
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  private constructor() {}

  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  // Initialize audio permissions and settings
  async initialize(): Promise<void> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      const audioMode = {
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      };

      await Audio.setAudioModeAsync(audioMode);
      console.log('Speech service initialized successfully');
    } catch (error) {
      console.error('Error initializing speech service:', error);
      throw error;
    }
  }

  // Start recording audio
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      await this.initialize();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Stop recording and get the audio file
  async stopRecording(): Promise<string | null> {
    if (!this.isRecording || !this.recording) {
      throw new Error('Not recording');
    }

    try {
      this.isRecording = false;
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      console.log('Recording stopped');
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  // Convert speech to text (simulated for now)
  async speechToText(audioUri: string): Promise<SpeechRecognitionResult> {
    try {
      // In a real implementation, you would send the audio file to a speech recognition service
      // For now, we'll simulate the speech-to-text conversion
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate different responses based on a random factor
      const responses = [
        "Hello, how are you today?",
        "What's the weather like?",
        "Can you help me with directions?",
        "I love this app!",
        "Thank you very much",
        "Good morning everyone",
        "How do you say hello in your language?",
        "This is amazing technology",
        "I need to translate this text",
        "Can you speak slower please?"
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        text: randomResponse,
        confidence: 0.85 + Math.random() * 0.1, // Random confidence between 0.85-0.95
        language: 'en' // Default to English for now
      };
    } catch (error) {
      console.error('Error in speech-to-text conversion:', error);
      throw error;
    }
  }

  // Text-to-speech conversion
  async speakText(text: string, language: string, options?: {
    pitch?: number;
    rate?: number;
    volume?: number;
  }): Promise<void> {
    try {
      const speechOptions = {
        language: language,
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 0.8,
        volume: options?.volume || 1.0,
      };

      await Speech.speak(text, speechOptions);
      console.log(`Speaking text in ${language}: ${text}`);
    } catch (error) {
      console.error('Error in text-to-speech conversion:', error);
      throw error;
    }
  }

  // Stop speaking
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
      console.log('Speech stopped');
    } catch (error) {
      console.error('Error stopping speech:', error);
      throw error;
    }
  }

  // Check if currently speaking
  async isSpeaking(): Promise<boolean> {
    return await Speech.isSpeakingAsync();
  }

  // Get available voices for a language
  async getAvailableVoices(language?: string): Promise<any[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (language) {
        return voices.filter(voice => voice.language.startsWith(language));
      }
      return voices;
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [];
    }
  }

  // Get recording status
  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording && this.recording) {
        await this.stopRecording();
      }
      await this.stopSpeaking();
      console.log('Speech service cleaned up');
    } catch (error) {
      console.error('Error cleaning up speech service:', error);
    }
  }
}

export default SpeechService.getInstance(); 