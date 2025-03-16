import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, Mic, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Add type definitions for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' }
];

export default function Chatbot() {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "Hello! I'm AgriChat, your farming assistant. How can I help you today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (voiceModeEnabled && lastMessage && !lastMessage.isUser && !isLoading) {
      speakMessage(lastMessage.text);
    }
  }, [messages, voiceModeEnabled, isLoading]);

  const getInitialMessage = (langCode: string) => {
    switch (langCode) {
      case 'hi':
        return "नमस्ते! मैं AgriChat हूं, आपका कृषि सहायक। मैं आपकी कैसे मदद कर सकता हूं?";
      case 'bn':
        return "হ্যালো! আমি AgriChat, আপনার কৃষি সহকারী। আমি আপনাকে কীভাবে সাহায্য করতে পারি?";
      default:
        return "Hello! I'm AgriChat, your farming assistant. How can I help you today?";
    }
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    setMessages([{ text: getInitialMessage(langCode), isUser: false }]);
    setIsLanguageMenuOpen(false);
  };

  const startListening = () => {
    try {
      if (!('webkitSpeechRecognition' in window)) {
        throw new Error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }

      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLanguage === 'hi' ? 'hi-IN' : 
                                  selectedLanguage === 'bn' ? 'bn-IN' : 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    } catch (error) {
      console.error('Speech recognition error:', error);
      setError(error instanceof Error ? error.message : 'Speech recognition failed to start');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakMessage = (text: string) => {
    // Clean the text for speech
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove italic markers
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/`/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with their text
      .replace(/[-*+]\s/g, '') // Remove list markers
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set language based on selected language
    if (selectedLanguage === 'hi') {
      utterance.lang = 'hi-IN';
      // For Hindi, speak the entire text at once with specific settings
      utterance.text = cleanText;
      utterance.rate = 0.8; // Slower rate for better Hindi pronunciation
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Add event handlers for Hindi speech
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      // Force continuous speech for Hindi
      utterance.onboundary = (event) => {
        if (event.name === 'sentence') {
          // Prevent stopping at sentence boundaries
          window.speechSynthesis.resume();
        }
      };
    } else if (selectedLanguage === 'bn') {
      utterance.lang = 'bn-IN';
      utterance.text = cleanText;
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    } else {
      utterance.lang = 'en-US';
      // For English, split into sentences for better natural pauses
      const sentences = cleanText.split(/([.!?]+)/).filter(Boolean);
      utterance.text = sentences.join(' ');
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    }

    // Set speaking state
    setIsSpeaking(true);
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending request to backend...');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          language: selectedLanguage
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response:', data);
      setMessages(prev => [...prev, { text: data.response, isUser: false }]);
    } catch (error) {
      console.error('Error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to the server';
      setError(errorMessage);
      setMessages(prev => [...prev, {
        text: `Error: ${errorMessage}`,
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceMode = () => {
    setVoiceModeEnabled(!voiceModeEnabled);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-lg h-[calc(100vh-8rem)]">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">AgriChat</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleVoiceMode}
                  className={`p-2 rounded-full transition-colors ${
                    voiceModeEnabled 
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title={voiceModeEnabled ? "Voice mode enabled" : "Voice mode disabled"}
                >
                  {voiceModeEnabled ? <Volume2 className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Globe className="h-5 w-5 text-gray-600" />
                  </button>
                  {isLanguageMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                            selectedLanguage === lang.code ? 'bg-gray-50 text-green-600' : ''
                          }`}
                        >
                          <span className="font-medium">{lang.nativeName}</span>
                          <span className="text-sm text-gray-500 ml-2">({lang.name})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded relative">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className={`prose ${message.isUser ? 'prose-invert' : ''} max-w-none`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-grow">
                          <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                        {!message.isUser && !voiceModeEnabled && (
                          <button
                            onClick={() => speakMessage(message.text)}
                            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            {isSpeaking ? (
                              <VolumeX className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Volume2 className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    selectedLanguage === 'hi' ? "अपना संदेश टाइप करें..." :
                    selectedLanguage === 'bn' ? "আপনার বার্তা টাইপ করুন..." :
                    "Type your message..."
                  }
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading || isListening}
                />
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={isLoading || isListening}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}