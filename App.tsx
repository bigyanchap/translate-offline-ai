import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  SafeAreaView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import optimizedTranslationService from './services/optimizedTranslationService';
import optimizedSpeechService from './services/optimizedSpeechService';
import memoryManager from './utils/memoryManager';

const { width, height } = Dimensions.get('window');

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  // Indian Languages supported by both Gemma 3n and Indic Parler-TTS Mini
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
];

/**
 * AI Translator App - Main Component
 * 
 * This app implements all 10 performance optimizations:
 * 1. Lazy Loading - Models load only when needed
 * 2. Background Unloading - Models unload when app goes to background
 * 3. Quantized Models - Q4/Q8 quantization for 50-75% size reduction
 * 4. Streaming TTS - Progressive audio generation
 * 5. Compact TTS - Kokoro model (82M parameters)
 * 6. Audio Compression - AAC/Opus compression
 * 7. Token Limiting - Max 256 tokens for memory control
 * 8. Queue Processing - Single-threaded model operations
 * 9. Core ML Ready - Platform-specific optimizations
 * 10. Cache Management - Priority-based caching with cleanup
 */
export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [userPreference, setUserPreference] = useState('hi'); // Default to Hindi
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [autoStopActive, setAutoStopActive] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // OPTIMIZATION #1: Initialize app with minimal startup overhead
  // Only loads user preferences, not models (lazy loading)
  useEffect(() => {
    loadUserPreference();
  }, []);

  const loadUserPreference = async () => {
    try {
      const preference = await optimizedTranslationService.loadUserPreference();
      setUserPreference(preference);
    } catch (error) {
      console.error('Error loading user preference:', error);
    }
  };

  const saveUserPreference = async (languageCode: string) => {
    try {
      await optimizedTranslationService.saveUserPreference(languageCode);
      setUserPreference(languageCode);
    } catch (error) {
      console.error('Error saving user preference:', error);
    }
  };

  // OPTIMIZATION #6: Start recording with audio compression and auto-stop
  // Uses optimized speech service with compressed audio formats and silence detection
  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscribedText('');
      setTranslatedText('');

      // OPTIMIZATION #6: Uses compressed audio recording (AAC/Opus) with auto-stop
      await optimizedSpeechService.startRecording({
        onAutoStop: async () => {
          // Handle auto-stop - process the recording
          setIsRecording(false);
          setAutoStopActive(false);
          try {
            const audioUri = await optimizedSpeechService.stopRecording();
            if (audioUri) {
              await processAudioRecording(audioUri);
            }
          } catch (error) {
            console.error('Error processing auto-stopped recording:', error);
          }
        },
        onAudioLevelChange: (level: number) => {
          // Update auto-stop indicator based on audio level
          setAutoStopActive(level < 10);
        }
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  // OPTIMIZATION #1, #7, #8: Stop recording and process with optimized services
  // Uses lazy loading, token limiting, and queue processing for optimal performance
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setAutoStopActive(false);
      const audioUri = await optimizedSpeechService.stopRecording();

      if (audioUri) {
        await processAudioRecording(audioUri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Process audio recording (used by both manual stop and auto-stop)
  const processAudioRecording = async (audioUri: string) => {
    try {
      // OPTIMIZATION #1: Lazy load models only when needed for speech-to-text
      const speechResult = await optimizedSpeechService.speechToText(audioUri);
      setTranscribedText(speechResult.text);
      
      // OPTIMIZATION #7: Language detection with token limiting
      const detected = await optimizedTranslationService.detectLanguage(speechResult.text);
      setDetectedLanguage(detected);
      
      // OPTIMIZATION #8: Auto-translate using queue processing to prevent conflicts
      if (detected === 'en') {
        // If English is detected, translate to user preference
        await translateText(speechResult.text, 'en', userPreference);
      } else {
        // If other language is detected, translate to English and save preference
        await translateText(speechResult.text, detected, 'en');
        if (detected !== userPreference) {
          saveUserPreference(detected);
        }
      }
    } catch (error) {
      console.error('Error processing audio recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    }
  };

  // OPTIMIZATION #7, #10: Translation with token limiting and smart caching
  // Limits tokens to 256 max and uses priority-based caching for performance
  const translateText = async (text: string, fromLang: string, toLang: string) => {
    setIsLoading(true);
    try {
      // OPTIMIZATION #7: Token limiting (max 256) and OPTIMIZATION #10: Smart caching
      const result = await optimizedTranslationService.translateText({
        text,
        fromLang,
        toLang,
      });
      
      setTranslatedText(result.translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OPTIMIZATION #4, #5: Text-to-speech with streaming and compact model
  // Uses streaming TTS for progressive output and compact Indic Parler-TTS Mini model
  const speakText = async (text: string, language: string) => {
    try {
      // OPTIMIZATION #4: Streaming TTS and OPTIMIZATION #5: Compact Indic Parler-TTS Mini model
      await optimizedSpeechService.speakText(text, { language });
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  const handleLanguageSelect = (languageCode: string) => {
    setUserPreference(languageCode);
    saveUserPreference(languageCode);
    setShowLanguageSelector(false);
    setShowLanguageModal(false);
  };

  const getLanguageName = (code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code)?.name || code;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>AI Translator</Text>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={styles.languageButtonText}>
            {getLanguageName(userPreference)}
          </Text>
          <Ionicons name="chevron-down" size={20} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalLanguageList} showsVerticalScrollIndicator={false}>
              {SUPPORTED_LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.modalLanguageItem,
                    userPreference === language.code && styles.selectedModalLanguageItem
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                >
                  <View style={styles.languageItemContent}>
                    <View style={styles.checkboxContainer}>
                      {userPreference === language.code ? (
                        <View style={styles.checkedCircle}>
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      ) : (
                        <View style={styles.uncheckedCircle} />
                      )}
                    </View>
                    <View style={styles.languageTextContainer}>
                      <Text style={styles.modalLanguageNativeName}>
                        {language.nativeName}
                      </Text>
                      <Text style={styles.modalLanguageEnglishName}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Recording Button */}
        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingButton
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isRecording ? ['#ff6b6b', '#ee5a24'] : ['#667eea', '#764ba2']}
              style={styles.recordButtonGradient}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={40}
                color="white"
              />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop Recording' : 'Tap to Record'}
          </Text>
          {autoStopActive && (
            <Text style={styles.autoStopText}>
              Auto-stop in 5s (silent)
            </Text>
          )}
        </View>

        {/* Transcribed Text */}
        {transcribedText && (
          <View style={styles.textCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Detected: {getLanguageName(detectedLanguage)}
              </Text>
              <TouchableOpacity
                onPress={() => speakText(transcribedText, detectedLanguage)}
                style={styles.speakButton}
              >
                <Ionicons name="volume-high" size={20} color="#667eea" />
              </TouchableOpacity>
            </View>
            <Text style={styles.transcribedText}>{transcribedText}</Text>
          </View>
        )}

        {/* Translated Text */}
        {translatedText && (
          <View style={styles.textCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Translated to: {getLanguageName(userPreference)}
              </Text>
              <TouchableOpacity
                onPress={() => speakText(translatedText, userPreference)}
                style={styles.speakButton}
              >
                <Ionicons name="volume-high" size={20} color="#667eea" />
              </TouchableOpacity>
            </View>
            <Text style={styles.translatedText}>{translatedText}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Translating...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 5,
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingButton: {
    transform: [{ scale: 1.1 }],
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  textCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  speakButton: {
    padding: 5,
  },
  transcribedText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 24,
  },
  translatedText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 24,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  autoStopText: {
    fontSize: 12,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalLanguageList: {
    maxHeight: 400,
  },
  modalLanguageItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedModalLanguageItem: {
    backgroundColor: '#f8f9ff',
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 15,
  },
  checkedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  languageTextContainer: {
    flex: 1,
  },
  modalLanguageNativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  modalLanguageEnglishName: {
    fontSize: 14,
    color: '#666',
  },
});
