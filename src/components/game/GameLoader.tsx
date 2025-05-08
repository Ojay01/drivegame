import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

const GameLoader = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);

    // Complete loading when page is fully loaded
    const handleLoad = () => {
      setProgress(100);
      clearInterval(timer);
      
      // Add a small delay before hiding the loader for a smoother transition
      setTimeout(() => {
        setLoading(false);
      }, 500);
    };

    // Listen for window load event
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }

    return () => clearInterval(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md px-6">
        <div className="flex items-center justify-center mb-6">
          <Activity className="text-green-400 mr-3" size={32} />
          <h1 className="text-3xl font-bold">1xDrives</h1>
        </div>
        
        <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div 
            className="absolute top-0 left-0 h-full bg-green-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-400">
          <span>Loading game assets...</span>
          <span>{Math.round(progress)}%</span>
        </div>
        
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-3">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLoader;