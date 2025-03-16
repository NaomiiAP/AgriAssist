import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Brain,
  CheckCircle,
  Leaf,
  TrendingUp,
  MessageSquareText,
  Store,
  Bug,
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { supabase } from '../lib/supabase';

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center space-x-4">
        <div className="bg-green-100 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ number, icon: Icon, title, description }: { number: string, icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg">
      <div className="bg-green-100 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-green-600" />
      </div>
      <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3">
        {number}
      </div>
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/predictor');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative min-h-screen flex items-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              AgriAssist - Your AI Companion for Smarter Farming
            </h1>
            <p className="text-xl text-gray-200 mb-8">
            An all-in-one AI-powered platform that helps farmers with crop disease detection, yield prediction, a multilingual voice-enabled chatbot, a marketplace, and pest control solutions.
            </p>
            <button 
              onClick={handleGetStarted}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              Try it out!
            </button>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
            How AgriAssist Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              icon={Upload}
              title="Upload a Crop Image"
              description="Take a photo of your plant and submit it."
            />
            <StepCard
              number="2"
              icon={Brain}
              title="AI Scans & Predicts"
              description="Our smart AI detects diseases, predicts yield, and gives irrigation guidance."
            />
            <StepCard
              number="3"
              icon={CheckCircle}
              title="Get Instant Recommendations"
              description="Receive treatment solutions, water schedules, and market insights."
            />
          </div>
          <div className="text-center mt-12">
            <button 
              onClick={handleGetStarted}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Try It Now
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
            Why Choose AgriAssist?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Leaf}
              title="AI Crop Health Scanner"
              description="Upload a crop photo & detect diseases instantly."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Yield & Price Predictor"
              description="Forecast production & find the best time to sell."
            />
            
            <FeatureCard
              icon={MessageSquareText}
              title="AgriChat Assistant"
              description="Ask farming-related questions & get AI-powered answers."
            />
            
            <FeatureCard
              icon={Store}
              title="Direct Farmer-to-Buyer Marketplace"
              description="Sell produce at fair prices."
            />
           
            <FeatureCard
              icon={Bug}
              title="AI Pest & Fertilizer Advisor"
              description="Get the best eco-friendly crop treatments."
            />
           
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}