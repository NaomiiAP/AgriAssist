import React, { useState, useEffect } from 'react';
import { Upload, Loader2, AlertCircle, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

interface PredictionResponse {
  disease: string;
  confidence: string;
  treatment: string;
  prevention: string;
}

// Disease treatment and prevention data
const diseaseData: { [key: string]: { treatment: string; prevention: string } } = {
  'healthy': {
    treatment: 'No treatment needed. Your plant appears to be healthy.',
    prevention: 'Continue with regular care:\n- Maintain proper watering schedule\n- Ensure adequate sunlight\n- Regular soil testing\n- Proper fertilization'
  },
  'leaf blight': {
    treatment: '1. Remove infected leaves\n2. Apply fungicide treatment\n3. Improve air circulation\n4. Reduce leaf wetness\n5. Apply copper-based fungicide\n6. Maintain proper plant spacing',
    prevention: '- Plant disease-resistant varieties\n- Maintain proper spacing\n- Regular pruning\n- Avoid overhead watering\n- Remove plant debris\n- Rotate crops annually'
  },
  'powdery mildew': {
    treatment: '1. Apply sulfur-based fungicide\n2. Remove infected plant parts\n3. Improve air circulation\n4. Reduce humidity\n5. Apply neem oil solution\n6. Use baking soda spray',
    prevention: '- Plant in well-ventilated areas\n- Maintain proper spacing\n- Regular monitoring\n- Use resistant varieties\n- Avoid excessive nitrogen\n- Keep leaves dry'
  },
  'rust': {
    treatment: '1. Remove infected leaves\n2. Apply fungicide\n3. Improve air circulation\n4. Reduce leaf wetness\n5. Apply copper-based fungicide\n6. Remove alternate hosts',
    prevention: '- Plant resistant varieties\n- Maintain proper spacing\n- Regular monitoring\n- Clean garden debris\n- Remove alternate hosts\n- Practice crop rotation'
  },
  'leaf spot': {
    treatment: '1. Remove infected leaves\n2. Apply fungicide\n3. Improve air circulation\n4. Reduce leaf wetness\n5. Apply copper-based fungicide\n6. Maintain proper spacing',
    prevention: '- Plant resistant varieties\n- Maintain proper spacing\n- Regular monitoring\n- Clean garden debris\n- Avoid overhead watering\n- Practice crop rotation'
  },
  'bacterial wilt': {
    treatment: '1. Remove infected plants\n2. Disinfect tools\n3. Improve soil drainage\n4. Apply copper-based bactericide\n5. Use disease-free seeds\n6. Practice crop rotation',
    prevention: '- Use certified disease-free seeds\n- Practice crop rotation\n- Improve soil drainage\n- Control insect vectors\n- Remove infected plants\n- Disinfect tools regularly'
  },
  'fusarium wilt': {
    treatment: '1. Remove infected plants\n2. Improve soil drainage\n3. Apply fungicide\n4. Use resistant varieties\n5. Solarize soil\n6. Practice crop rotation',
    prevention: '- Use resistant varieties\n- Practice crop rotation\n- Improve soil drainage\n- Solarize soil\n- Use disease-free seeds\n- Maintain soil pH'
  },
  'anthracnose': {
    treatment: '1. Remove infected plant parts\n2. Apply fungicide\n3. Improve air circulation\n4. Reduce humidity\n5. Apply copper-based fungicide\n6. Maintain proper spacing',
    prevention: '- Use disease-free seeds\n- Practice crop rotation\n- Maintain proper spacing\n- Remove plant debris\n- Avoid overhead watering\n- Use resistant varieties'
  },
  'downy mildew': {
    treatment: '1. Remove infected leaves\n2. Apply fungicide\n3. Improve air circulation\n4. Reduce humidity\n5. Apply copper-based fungicide\n6. Maintain proper spacing',
    prevention: '- Plant resistant varieties\n- Maintain proper spacing\n- Regular monitoring\n- Remove plant debris\n- Avoid overhead watering\n- Practice crop rotation'
  },
  'root rot': {
    treatment: '1. Improve soil drainage\n2. Remove infected plants\n3. Apply fungicide\n4. Reduce watering\n5. Use well-draining soil\n6. Apply beneficial microbes',
    prevention: '- Improve soil drainage\n- Use well-draining soil\n- Avoid overwatering\n- Practice crop rotation\n- Use disease-free seeds\n- Maintain proper soil pH'
  },
  'mosaic virus': {
    treatment: '1. Remove infected plants\n2. Control insect vectors\n3. Use disease-free seeds\n4. Practice crop rotation\n5. Remove weed hosts\n6. Apply insecticide',
    prevention: '- Use disease-free seeds\n- Control insect vectors\n- Remove weed hosts\n- Practice crop rotation\n- Use resistant varieties\n- Regular monitoring'
  },
  'blight': {
    treatment: '1. Remove infected parts\n2. Apply fungicide\n3. Improve air circulation\n4. Reduce humidity\n5. Apply copper-based fungicide\n6. Maintain proper spacing',
    prevention: '- Use disease-free seeds\n- Practice crop rotation\n- Maintain proper spacing\n- Remove plant debris\n- Avoid overhead watering\n- Use resistant varieties'
  },
  'scab': {
    treatment: '1. Remove infected parts\n2. Apply fungicide\n3. Improve air circulation\n4. Reduce humidity\n5. Apply sulfur-based fungicide\n6. Maintain proper spacing',
    prevention: '- Use disease-free seeds\n- Practice crop rotation\n- Maintain proper spacing\n- Remove plant debris\n- Avoid overhead watering\n- Use resistant varieties'
  },
  'canker': {
    treatment: '1. Remove infected branches\n2. Apply fungicide\n3. Improve air circulation\n4. Reduce humidity\n5. Apply copper-based fungicide\n6. Maintain proper spacing',
    prevention: '- Use disease-free plants\n- Practice crop rotation\n- Maintain proper spacing\n- Remove plant debris\n- Avoid overhead watering\n- Use resistant varieties'
  },
  'gummy stem blight': {
    treatment: '1. Remove infected parts\n2. Apply fungicide\n3. Improve air circulation\n4. Reduce humidity\n5. Apply copper-based fungicide\n6. Maintain proper spacing',
    prevention: '- Use disease-free seeds\n- Practice crop rotation\n- Maintain proper spacing\n- Remove plant debris\n- Avoid overhead watering\n- Use resistant varieties'
  }
};

export default function CropPredictor() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [model, setModel] = useState<any>(null);

  // Load the model when component mounts
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Load MobileNet model
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
      } catch (error) {
        console.error('Error loading model:', error);
        setError('Failed to load AI model. Please refresh the page.');
      }
    };
    loadModel();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setPrediction(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setPrediction(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !model) return;

    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Create an image element
      const img = new Image();
      img.src = selectedImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Get predictions from the model
      const predictions = await model.classify(img);
      
      // Keywords that might indicate plant diseases
      const diseaseKeywords = [
        'blight', 'mildew', 'rust', 'spot', 'wilt', 'rot', 'mosaic', 'scab', 
        'canker', 'disease', 'fungus', 'mold', 'infection', 'lesion', 'necrosis',
        'chlorosis', 'yellowing', 'browning', 'wilting', 'spots', 'patches'
      ];

      // Check for disease-related terms in predictions
      const diseasePredictions = predictions.filter((p: any) => 
        diseaseKeywords.some(keyword => 
          p.className.toLowerCase().includes(keyword)
        )
      );

      if (diseasePredictions.length > 0) {
        // Get the prediction with highest probability
        const bestPrediction = diseasePredictions.reduce((prev: any, current: any) => 
          (prev.probability > current.probability) ? prev : current
        );

        // Find the most relevant disease from our database
        const disease = Object.keys(diseaseData).find(d => 
          bestPrediction.className.toLowerCase().includes(d.toLowerCase())
        ) || 'leaf blight'; // Default to leaf blight if no exact match

        setPrediction({
          disease: disease.charAt(0).toUpperCase() + disease.slice(1),
          confidence: `${(bestPrediction.probability * 100).toFixed(1)}%`,
          treatment: diseaseData[disease].treatment,
          prevention: diseaseData[disease].prevention
        });
      } else {
        // Check for healthy plant indicators
        const healthyKeywords = ['healthy', 'fresh', 'green', 'growing', 'plant', 'leaf', 'flower'];
        const healthyIndicators = predictions.filter((p: any) => 
          healthyKeywords.some(keyword => 
            p.className.toLowerCase().includes(keyword)
          )
        );

        if (healthyIndicators.length > 0) {
          setPrediction({
            disease: 'Healthy',
            confidence: `${(healthyIndicators[0].probability * 100).toFixed(1)}%`,
            treatment: diseaseData['healthy'].treatment,
            prevention: diseaseData['healthy'].prevention
          });
        } else {
          // If we can't confidently determine health status, suggest further inspection
          // Calculate confidence based on the highest probability prediction
          const maxProbability = Math.max(...predictions.map((p: any) => p.probability));
          setPrediction({
            disease: 'Potential Issues Detected',
            confidence: `${(maxProbability * 100).toFixed(1)}%`,
            treatment: '1. Take a closer look at the plant\n2. Check for visible signs of disease\n3. Monitor plant growth\n4. Consider consulting a plant expert\n5. Take additional photos from different angles\n6. Document any changes over time',
            prevention: '- Regular plant inspection\n- Maintain proper growing conditions\n- Monitor plant health\n- Keep records of plant condition\n- Practice good plant hygiene\n- Regular maintenance'
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl mt-10 font-bold text-gray-800 mb-4">
          Crop Disease Predictor
        </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload a photo of your crop to get instant AI-powered disease detection and treatment recommendations.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragging 
                ? 'border-green-500 bg-green-50 scale-[1.02]' 
                : 'border-gray-300 hover:border-green-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedImage ? (
              <div className="space-y-6">
                <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected crop"
                    className="max-w-md mx-auto rounded-lg shadow-lg"
                />
                <button
                    onClick={() => {
                      setSelectedImage(null);
                      setPrediction(null);
                      setError(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
                <div className="text-gray-600">
                  <p className="text-xl font-semibold mb-2">
                    Upload Your Crop Image
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop your image here or click to browse
                  </p>
                  <label className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors shadow-md hover:shadow-lg">
                    Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileInput}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {selectedImage && (
            <div className="mt-8">
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !model}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Analyzing Image...
                  </span>
                ) : !model ? (
                  'Loading AI Model...'
                ) : (
                  'Analyze Crop'
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-8 p-4 bg-red-50 rounded-xl flex items-center text-red-600 border border-red-200">
              <AlertCircle className="w-5 h-5 mr-3" />
              <p>{error}</p>
            </div>
          )}

          {prediction && (
            <div className="mt-8 space-y-8">
              <div className="bg-green-50 p-4 rounded-xl flex items-center text-green-600 border border-green-200">
                <CheckCircle className="w-5 h-5 mr-3" />
                <p className="font-medium">Analysis Complete</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Disease Detected</h3>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-600">{prediction.disease}</p>
                    <p className="text-sm text-gray-500">Confidence: {prediction.confidence}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Recommended Treatment</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{prediction.treatment}</ReactMarkdown>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 md:col-span-2">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Prevention Tips</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{prediction.prevention}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}