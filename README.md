# AI Translator - React Native Expo App

A sophisticated React Native application that provides real-time speech-to-text translation with auto language detection using the Gemma 3n model. The app features a beautiful UI with purple-pink gradients and glossy white cards.

## Features

### 🎯 Core Functionality
- **Auto Language Detection**: Automatically detects the language being spoken
- **Smart Translation Logic**: 
  - If English is spoken → translates to user's preferred language (default: Hindi)
  - If other language is spoken → translates to English and saves as new preference
- **User Preference Memory**: Remembers user's preferred language across sessions
- **Manual Language Selection**: Users can manually change target languages

### 🎨 Beautiful UI Design
- **White background** with subtle purple-pink gradient accents
- **Black text** for optimal readability
- **Purple-pink gradient buttons** for interactive elements
- **Glossy white cards** with subtle shadows for content display
- **Modern, clean interface** with smooth animations

### 🗣️ Speech Features
- **Real-time Speech Recording**: Tap to record, tap to stop
- **Auto-Stop on Silence**: Automatically stops recording after 5 seconds of silence
- **Speech-to-Text Conversion**: Converts spoken words to text
- **Text-to-Speech**: Listen to translations in the target language
- **Audio Permissions**: Handles microphone permissions gracefully

### 🌍 Supported Languages
The app supports 21 Indian languages with both translation and text-to-speech capabilities:

**Indian Languages:**
- Assamese (as) - অসমীয়া
- Bengali (bn) - বাংলা
- Bodo (brx) - बड़ो
- Dogri (doi) - डोगरी
- English (en) - English
- Gujarati (gu) - ગુજરાતી
- Hindi (hi) - हिन्दी (Default preference)
- Kannada (kn) - ಕನ್ನಡ
- Konkani (kok) - कोंकणी
- Maithili (mai) - मैथिली
- Malayalam (ml) - മലയാളം
- Manipuri (mni) - মৈতৈলোন্
- Marathi (mr) - मराठी
- Nepali (ne) - नेपाली
- Odia (or) - ଓଡ଼ିଆ
- Sanskrit (sa) - संस्कृतम्
- Santali (sat) - ᱥᱟᱱᱛᱟᱲᱤ
- Sindhi (sd) - سنڌي
- Tamil (ta) - தமிழ்
- Telugu (te) - తెలుగు
- Urdu (ur) - اردو

All languages are supported by both the Gemma 3n translation model and Indic Parler-TTS Mini for text-to-speech.

## Technology Stack

- **React Native** with **Expo** for cross-platform development
- **TypeScript** for type safety
- **Gemma 3n Model** for local AI translation (no server calls)
- **Indic Parler-TTS Mini** for multi-language text-to-speech
- **Expo AV** for audio recording and playback
- **Expo Speech** for text-to-speech functionality
- **AsyncStorage** for persistent user preferences
- **Linear Gradient** for beautiful UI effects

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator

### 1. Clone and Install
```bash
# Navigate to the project directory
cd translate-ai

# Install dependencies
npm install
```

### 2. Install Additional Dependencies
```bash
# Install required Expo packages
npx expo install expo-speech expo-av expo-file-system @react-native-async-storage/async-storage expo-linear-gradient

# Install Google AI for Gemma model integration
npm install @google/generative-ai
```

### 3. Configure Gemma 3n Model

To use the actual Gemma 3n model instead of mock translations:

1. **Download Gemma 3n Model**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Download the Gemma 3n model files
   - Place them in the `assets/models/` directory

2. **Update Translation Service**:
   Replace the mock translation in `services/translationService.ts`:

```typescript
// In the translateText method, replace the mockTranslation call with:
const response = await this.model.generateContent(prompt);
const translatedText = response.response.text();
```

### 4. Run the Application

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
translate-ai/
├── App.tsx                 # Main application component
├── services/
│   ├── translationService.ts  # Gemma 3n translation service
│   └── speechService.ts       # Speech recognition and TTS service
├── assets/
│   └── models/             # Gemma 3n model files (to be added)
├── package.json
└── README.md
```

## How It Works

### 1. Language Detection Flow
```
User speaks → Audio recording → Speech-to-text → Language detection → Translation decision
```

### 2. Translation Logic
- **English detected**: Translate to user's preferred language
- **Other language detected**: Translate to English and update user preference
- **User manually changes language**: Save new preference for future use

### 3. User Preference Management
- Preferences are stored locally using AsyncStorage
- Default preference is Hindi
- Preferences persist across app sessions
- Auto-updates when new languages are detected

## Customization

### Adding New Languages
The app currently supports 21 Indian languages. To add new languages:

1. Add language to `SUPPORTED_LANGUAGES` array in `App.tsx`
2. Ensure the language is supported by both Gemma 3n and Indic Parler-TTS Mini
3. Add language mapping in `translationService.ts`
4. Update language detection patterns if needed

### UI Customization
- Modify colors in the `styles` object
- Update gradient colors in `LinearGradient` components
- Adjust card styling for different visual effects

### Translation Model
- Replace mock translations with actual Gemma 3n calls
- Implement caching for better performance
- Add confidence scoring for translations

## Performance Optimizations

### Current Optimizations
- **Translation Caching**: Prevents repeated translations of the same text
- **Async Operations**: Non-blocking UI during translation
- **Memory Management**: Proper cleanup of audio resources

### Future Optimizations
- **Model Quantization**: Reduce Gemma model size for mobile
- **Batch Processing**: Handle multiple translations efficiently
- **Offline Mode**: Cache common translations for offline use

## Troubleshooting

### Common Issues

1. **Audio Permission Denied**
   - Ensure microphone permissions are granted
   - Check device settings for app permissions

2. **Translation Not Working**
   - Verify Gemma model files are properly loaded
   - Check internet connection for model downloads
   - Review console logs for error messages

3. **App Crashes on Startup**
   - Clear npm cache: `npm cache clean --force`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Reset Expo cache: `expo r -c`

### Debug Mode
Enable debug logging by setting environment variables:
```bash
export DEBUG=true
export LOG_LEVEL=debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google AI for the Gemma 3n model
- Expo team for the excellent development platform
- React Native community for the robust ecosystem

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the Expo documentation for platform-specific issues 