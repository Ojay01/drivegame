import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";

const GameLoader = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");

  useEffect(() => {
    const TOTAL_DURATION = 5000; // 5 seconds
    const FADE_OUT_DURATION = 500; // 0.5 seconds for fade out
    const UPDATE_INTERVAL = 50; // Update every 50ms for smooth animation

    const loadingMessages = [
      "Initializing...",
      "Loading game assets...",
      "Preparing environment...",
      "Setting up gameplay...",
      "Almost ready...",
      "Finalizing...",
    ];

    let startTime = Date.now();
    let messageIndex = 0;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / TOTAL_DURATION) * 100, 100);

      setProgress(progressPercent);

      // Update loading message based on progress
      const newMessageIndex = Math.floor(
        (elapsed / TOTAL_DURATION) * loadingMessages.length
      );
      if (
        newMessageIndex !== messageIndex &&
        newMessageIndex < loadingMessages.length
      ) {
        messageIndex = newMessageIndex;
        setLoadingText(loadingMessages[messageIndex]);
      }

      // Complete loading after 5 seconds
      if (elapsed >= TOTAL_DURATION) {
        setProgress(100);
        setLoadingText("Ready!");
        clearInterval(timer);

        // Fade out after a brief moment
        setTimeout(() => {
          setLoading(false);
        }, FADE_OUT_DURATION);
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="w-full max-w-md px-6">
        {/* Logo and Title */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <Activity
              className="text-green-400 mr-3 animate-pulse"
              size={36}
              style={{ filter: "drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))" }}
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            1xDrives
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-3 shadow-inner">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-100 ease-out rounded-full shadow-lg"
            style={{
              width: `${progress}%`,
              boxShadow:
                progress > 0 ? "0 0 15px rgba(34, 197, 94, 0.6)" : "none",
            }}
          />
          {/* Shimmer effect */}
          <div
            className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"
            style={{
              transform: `translateX(${(progress / 100) * 100 - 20}%)`,
              transition: "transform 0.1s ease-out",
            }}
          />
        </div>

        {/* Progress Info */}
        <div className="flex justify-between text-sm text-gray-300 mb-8">
          <span className="transition-all duration-300">{loadingText}</span>
          <span className="font-mono text-green-400">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-green-400 rounded-full animate-bounce shadow-lg"
                style={{
                  animationDelay: `${i * 200}ms`,
                  boxShadow: "0 0 10px rgba(34, 197, 94, 0.5)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Additional Visual Elements */}
        <div className="mt-8 flex justify-center opacity-50">
          <div className="text-xs text-gray-500 font-mono">DevKingston</div>
        </div>
      </div>

      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-10 -left-10 w-20 h-20 bg-green-400 rounded-full opacity-10 animate-ping"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-1/4 right-10 w-16 h-16 bg-blue-400 rounded-full opacity-10 animate-ping"
          style={{ animationDuration: "4s", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-green-400 rounded-full opacity-10 animate-ping"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        ></div>
      </div>
    </div>
  );
};

export default GameLoader;
