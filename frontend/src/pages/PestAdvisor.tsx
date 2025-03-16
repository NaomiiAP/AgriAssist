import React, { useState } from 'react';
import { Bug, Sprout, Droplets } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PestAdvisor() {
  const [selectedPest, setSelectedPest] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [severity, setSeverity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !selectedPest || !severity) {
      setError('Please select all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAdvice(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/pest-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crop: selectedCrop,
          pest: selectedPest,
          severity: severity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAdvice(data.response);
    } catch (error) {
      console.error('Error details:', error);
      setError(error instanceof Error ? error.message : 'Failed to get pest advice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <Bug className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Pest & Fertilizer Advisor</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Type
                  </label>
                  <input
                    type="text"
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    placeholder="Enter your crop type (e.g., tomatoes, wheat, rice)"
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pest Type
                  </label>
                  <select
                    value={selectedPest}
                    onChange={(e) => setSelectedPest(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isLoading}
                  >
                    <option value="">Select pest type</option>
                    <option value="aphids">Aphids</option>
                    <option value="caterpillars">Caterpillars</option>
                    <option value="beetles">Beetles</option>
                    <option value="mites">Spider Mites</option>
                    <option value="whiteflies">Whiteflies</option>
                    <option value="thrips">Thrips</option>
                    <option value="grasshoppers">Grasshoppers</option>
                    <option value="leafhoppers">Leafhoppers</option>
                    <option value="cutworms">Cutworms</option>
                    <option value="armyworms">Armyworms</option>
                    <option value="fruit-flies">Fruit Flies</option>
                    <option value="weevils">Weevils</option>
                    <option value="stink-bugs">Stink Bugs</option>
                    <option value="scale-insects">Scale Insects</option>
                    <option value="nematodes">Nematodes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Infestation Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isLoading}
                  >
                    <option value="">Select severity</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Getting Advice...' : 'Get Recommendations'}
                </button>
              </form>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              {isLoading ? (
                <div className="flex space-x-2 justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce delay-200"></div>
                </div>
              ) : advice ? (
                <div className="prose max-w-none">
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                        <Bug className="h-5 w-5 mr-2" />
                        Immediate Control Measures
                      </h3>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="text-gray-700 mb-1">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-green-800">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700 text-sm">{children}</li>,
                        }}
                      >
                        {advice.split(/(?=\*\*Immediate Control Measures:|Control Measures:)/).filter(section => 
                          section.toLowerCase().includes('immediate control measures:') ||
                          section.toLowerCase().includes('control measures:')
                        ).join('\n').replace(/\*\*/g, '').split('\n').slice(0, 5).join('\n')}
                      </ReactMarkdown>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                        <Sprout className="h-5 w-5 mr-2" />
                        Preventive Strategies
                      </h3>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="text-gray-700 mb-1">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-green-800">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700 text-sm">{children}</li>,
                        }}
                      >
                        {advice.split(/(?=\*\*Preventive Strategies:|Prevention:)/).filter(section => 
                          section.toLowerCase().includes('preventive strategies:') ||
                          section.toLowerCase().includes('prevention:')
                        ).join('\n').replace(/\*\*/g, '').split('\n').slice(0, 5).join('\n')}
                      </ReactMarkdown>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                        <Droplets className="h-5 w-5 mr-2" />
                        Treatment Schedule
                      </h3>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="text-gray-700 mb-1">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-green-800">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700 text-sm">{children}</li>,
                        }}
                      >
                        {advice.split(/(?=\*\*Treatment Schedule:|Schedule:)/).filter(section => 
                          section.toLowerCase().includes('treatment schedule:') ||
                          section.toLowerCase().includes('schedule:')
                        ).join('\n').replace(/\*\*/g, '').split('\n').slice(0, 4).join('\n')}
                      </ReactMarkdown>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                        <Bug className="h-5 w-5 mr-2" />
                        Safety Precautions
                      </h3>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="text-gray-700 mb-1">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-green-800">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700 text-sm">{children}</li>,
                        }}
                      >
                        {advice.split(/(?=\*\*Safety Precautions:|Safety:)/).filter(section => 
                          section.toLowerCase().includes('safety precautions:') ||
                          section.toLowerCase().includes('safety:')
                        ).join('\n').replace(/\*\*/g, '').split('\n').slice(0, 4).join('\n')}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Bug className="h-5 w-5 text-green-600 mr-2 mt-1" />
                    <div>
                      <p className="font-semibold">Pest Control</p>
                      <p className="text-gray-600">Select a pest type to get specific control measures</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Sprout className="h-5 w-5 text-green-600 mr-2 mt-1" />
                    <div>
                      <p className="font-semibold">Organic Solutions</p>
                      <p className="text-gray-600">Eco-friendly treatment recommendations will appear here</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Droplets className="h-5 w-5 text-green-600 mr-2 mt-1" />
                    <div>
                      <p className="font-semibold">Application Schedule</p>
                      <p className="text-gray-600">Treatment timing and frequency will be shown here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}