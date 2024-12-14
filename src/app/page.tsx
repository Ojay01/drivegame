'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Car, Coins, AlertTriangle } from 'lucide-react';

// Define types for game history and state
type GameHistoryEntry = {
  multiplier: string;
  result: 'cash_out' | 'crash';
  winnings: number;
};

type GameState = 'betting' | 'driving' | 'crashed';

const CarMultiplierGame: React.FC = () => {
  const [balance, setBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashOut, setAutoCashOut] = useState<number>(2);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [showRestartAlert, setShowRestartAlert] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const multiplierRef = useRef<number>(1);
  const crashPointRef = useRef<number>(0);
  const carPositionRef = useRef<number>(0);
  const roadRef = useRef<CanvasRenderingContext2D | null>(null);
  const treesRef = useRef<{ x: number, y: number, width: number, height: number }[]>([]);

  // Memoize tree drawing function
  const drawTree = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x + width * 0.4, y + height, width * 0.2, height * 0.2);

    // Foliage
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
  }, []);

  // Memoize car drawing function
  const drawCar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Car body
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 50, y);
    ctx.lineTo(x + 45, y - 20);
    ctx.lineTo(x + 5, y - 20);
    ctx.closePath();
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#B0BEC5';
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 20);
    ctx.lineTo(x + 40, y - 20);
    ctx.lineTo(x + 35, y - 30);
    ctx.lineTo(x + 15, y - 30);
    ctx.closePath();
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(x + 10, y + 5, 5, 0, Math.PI * 2);
    ctx.arc(x + 40, y + 5, 5, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Memoize scene drawing function
  const drawScene = useCallback((crashed = false) => {
    const ctx = roadRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    // Draw trees with parallax effect
    treesRef.current.forEach(tree => {
      const parallaxOffset = carPositionRef.current * 0.1;
      drawTree(
        ctx, 
        (tree.x - parallaxOffset) % canvas.width, 
        tree.y, 
        tree.width, 
        tree.height
      );
      
      // Draw additional trees for continuous background
      drawTree(
        ctx, 
        (tree.x - parallaxOffset + canvas.width) % canvas.width, 
        tree.y, 
        tree.width, 
        tree.height
      );
    });

    // Ground gradient
    const groundGradient = ctx.createLinearGradient(0, canvas.height / 2, 0, canvas.height);
    groundGradient.addColorStop(0, '#90EE90');
    groundGradient.addColorStop(1, '#228B22');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    // Road
    ctx.fillStyle = '#444';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

    // Road lane
    ctx.strokeStyle = 'white';
    ctx.setLineDash([50, 30]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height * 0.7);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Draw car
    ctx.save();
    if (crashed) {
      ctx.translate(canvas.width / 2, canvas.height - 100 - carPositionRef.current);
      ctx.rotate(Math.PI / 4);
      drawCar(ctx, -25, 0);
    } else {
      drawCar(ctx, canvas.width / 2 - 25, canvas.height - 100 - carPositionRef.current);
    }
    ctx.restore();
  }, [drawTree, drawCar]);
  
  const crashGame: () => void = useCallback(() => {

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    drawScene(true);

    setHistory(prev => [
      { 
        multiplier: multiplierRef.current.toFixed(2), 
        result: 'crash',
        winnings: 0
      },
      ...prev.slice(0, 4)
    ]);

    setShowRestartAlert(true);
  }, [drawScene]);

  // Memoize start auto game function
  const startAutoGame = useCallback(() => {
    if (balance < betAmount) {
      alert("Insufficient balance!");
      return;
    }
  
    setGameState('driving');
    setMultiplier(1);
    multiplierRef.current = 1;
    carPositionRef.current = 0;
    setShowRestartAlert(false);
  
    // Randomize crash point between 1 and 10
    crashPointRef.current = 1 + Math.random() * 9;
  
    // Deduct bet amount
    setBalance(prev => prev - betAmount);
  
    const animate = () => {
      const currentMultiplier = multiplierRef.current;
      let increment = 0;
  
      if (currentMultiplier < 10) {
        increment = 1 / 60; // Approx 1 second to increment by 1
      } else {
        increment = 1 / 30; // Twice as fast once multiplier exceeds 10
      }
  
      carPositionRef.current += increment * 100; // Adjust car speed proportionally
      multiplierRef.current += increment;
      setMultiplier(Number(multiplierRef.current.toFixed(2)));
  
      drawScene();
  
      if (multiplierRef.current >= crashPointRef.current) {
        crashGame();
        return;
      }
  
      animationFrameRef.current = requestAnimationFrame(animate);
    };
  
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [balance, betAmount, drawScene, crashGame]);


  // Memoize cash out function
  const handleCashOut = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Calculate winnings
    const winnings = betAmount * multiplier;
    setBalance(prev => prev + winnings);

    // Update game history
    setHistory(prev => [
      { 
        multiplier: multiplierRef.current.toFixed(2), 
        result: 'cash_out',
        winnings
      },
      ...prev.slice(0, 4)
    ]);

    setShowRestartAlert(true);
    setTimeout(startAutoGame, 1500);
  }, [betAmount, multiplier, startAutoGame]);

  // Memoize tree initialization
  const initializeTrees = useCallback(() => {
    const trees: { x: number, y: number, width: number, height: number }[] = [];
    for (let i = 0; i < 20; i++) {
      trees.push({
        x: Math.random() * 800,
        y: 300 + Math.random() * 200,
        width: 30 + Math.random() * 50,
        height: 100 + Math.random() * 100
      });
    }
    treesRef.current = trees;
  }, []);

  // Canvas initialization effect
  useEffect(() => {
    const canvas = canvasRef.current;
  
    if (!canvas) {
      console.warn('Canvas reference is not available.');
      return;
    }
  
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Failed to get canvas 2D context.');
      return;
    }
  
    // Dynamically set canvas dimensions based on its container
    const container = canvas.parentElement;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    } else {
      console.warn('Canvas container not found. Using default dimensions.');
      canvas.width = 800;
      canvas.height = 600;
    }
  
    // Store the context reference
    roadRef.current = ctx;
  
    // Initialize trees and draw the scene
    initializeTrees();
    drawScene();
  
    return () => {
      // Cleanup logic if needed
      roadRef.current = null;
    };
  }, [canvasRef, initializeTrees, drawScene]);

  // Auto start game on mount
  useEffect(() => {
    startAutoGame();
  }, [startAutoGame]);

  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-800 min-h-screen flex flex-col p-4">
      <canvas ref={canvasRef} className="w-full h-64 bg-gray-200 mb-4 rounded-lg shadow-lg" />
      
      <div className="bg-white/10 rounded-lg p-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            <span className="text-lg font-semibold">
              Balance: ${balance.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Car className="w-6 h-6 text-green-400" />
            <span className="text-lg font-semibold">
              Multiplier: {multiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Bet Amount
            </label>
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max={balance}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Auto Cash Out
            </label>
            <input 
              type="number" 
              value={autoCashOut}
              onChange={(e) => setAutoCashOut(Number(e.target.value))}
              className="w-full bg-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              step="0.1"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <button 
            onClick={startAutoGame}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center space-x-2"
          >
            <Car className="w-5 h-5" />
            <span>Start Game</span>
          </button>
          <button 
            onClick={handleCashOut}
            disabled={gameState !== 'driving'}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Coins className="w-5 h-5" />
            <span>Cash Out</span>
          </button>
        </div>

        {showRestartAlert && (
          <div className="mt-4 bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <span className="text-yellow-500">
              Game Over! Restarting automatically...
            </span>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Game History</h3>
          <div className="space-y-2">
            {history.map((entry, index) => (
              <div 
                key={index} 
                className={`flex justify-between p-2 rounded-md ${
                  entry.result === 'crash' 
                    ? 'bg-red-500/20 text-red-300' 
                    : 'bg-green-500/20 text-green-300'
                }`}
              >
                <span>Multiplier: {entry.multiplier}x</span>
                <span>
                  {entry.result === 'crash' 
                    ? 'Crashed' 
                    : `Won $${entry.winnings.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarMultiplierGame;