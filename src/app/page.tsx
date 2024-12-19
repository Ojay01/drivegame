"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Car, Coins, AlertTriangle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const CarMultiplierGame: React.FC = () => {
  const [balance, setBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashOut, setAutoCashOut] = useState<number>(2);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gameState, setGameState] = useState<
    "betting" | "driving" | "crashed" | "waiting"
  >("driving");
  const [history, setHistory] = useState<
    { multiplier: string; result: string; winnings: number }[]
  >([]);
  const [showRestartAlert, setShowRestartAlert] = useState<boolean>(false);
  const [hasPlacedBet, setHasPlacedBet] = useState<boolean>(false);
  const [pendingBet, setPendingBet] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const multiplierRef = useRef<number>(1);
  const crashPointRef = useRef<number>(0);
  const carPositionRef = useRef<number>(0);
  const cloudPositionsRef = useRef<{ x: number; y: number }[]>([]);
  const mountainPositionsRef = useRef<{ x: number; height: number }[]>([]);
  const currentBetRef = useRef<number>(0);
  const initializeScene = useCallback(() => {
    // Initialize clouds
    cloudPositionsRef.current = Array(5)
      .fill(0)
      .map(() => ({
        x: Math.random() * 800,
        y: Math.random() * 100 + 20,
      }));

    // Initialize mountains
    mountainPositionsRef.current = Array(3)
      .fill(0)
      .map(() => ({
        x: Math.random() * 800,
        height: Math.random() * 100 + 50,
      }));
  }, []);

  const drawCloud = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
      ctx.arc(x + 15, y + 10, 15, 0, Math.PI * 2);
      ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
      ctx.fill();
    },
    []
  );

  const drawMountain = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, height: number) => {
      ctx.fillStyle = "#4A5568";
      ctx.beginPath();
      ctx.moveTo(x, ctx.canvas.height - 50);
      ctx.lineTo(x + 100, ctx.canvas.height - height - 50);
      ctx.lineTo(x + 200, ctx.canvas.height - 50);
      ctx.fill();

      // Snow cap
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(x + 85, ctx.canvas.height - height - 40);
      ctx.lineTo(x + 100, ctx.canvas.height - height - 50);
      ctx.lineTo(x + 115, ctx.canvas.height - height - 40);
      ctx.fill();
    },
    []
  );

  const drawCar = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, isCrashed: boolean) => {
      // Car body
      ctx.fillStyle = isCrashed ? "#FF0000" : "#E53935";
      ctx.beginPath();
      ctx.moveTo(x, ctx.canvas.height - 75);
      ctx.lineTo(x + 50, ctx.canvas.height - 75);
      ctx.lineTo(x + 45, ctx.canvas.height - 85);
      ctx.lineTo(x + 10, ctx.canvas.height - 85);
      ctx.closePath();
      ctx.fill();

      // Car base
      ctx.fillStyle = isCrashed ? "#CC0000" : "#C62828";
      ctx.fillRect(x + 5, ctx.canvas.height - 75, 40, 25);

      // Windows
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(x + 15, ctx.canvas.height - 83, 20, 8);

      // Wheels with suspension animation
      const bounceOffset = Math.sin(Date.now() / 100) * 2;
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(x + 15, ctx.canvas.height - 50 + bounceOffset, 8, 0, Math.PI * 2);
      ctx.arc(x + 35, ctx.canvas.height - 50 + bounceOffset, 8, 0, Math.PI * 2);
      ctx.fill();

      // Wheel rims
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(x + 15, ctx.canvas.height - 50 + bounceOffset, 3, 0, Math.PI * 2);
      ctx.arc(x + 35, ctx.canvas.height - 50 + bounceOffset, 3, 0, Math.PI * 2);
      ctx.fill();
    },
    []
  );

  const drawScene = useCallback(
    (isCrashed = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - 50);
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(1, "#E0F7FA");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height - 50);

      // Draw mountains
      mountainPositionsRef.current.forEach((mountain) => {
        drawMountain(ctx, mountain.x, mountain.height);
      });

      // Animate and draw clouds
      cloudPositionsRef.current.forEach((cloud) => {
        cloud.x -= 0.5;
        if (cloud.x < -50) cloud.x = canvas.width + 50;
        drawCloud(ctx, cloud.x, cloud.y);
      });

      // Road
      ctx.fillStyle = "#4A4A4A";
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

      // Road markings
      ctx.strokeStyle = "#FFFFFF";
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 25);
      ctx.lineTo(canvas.width, canvas.height - 25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw car
      drawCar(ctx, carPositionRef.current, isCrashed);

      // Speed lines when moving fast
      if (multiplierRef.current > 2 && !isCrashed) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const lineX = carPositionRef.current - i * 20;
          if (lineX > 0) {
            ctx.beginPath();
            ctx.moveTo(lineX, canvas.height - 70);
            ctx.lineTo(lineX - 20, canvas.height - 70);
            ctx.stroke();
          }
        }
      }
    },
    [drawCloud, drawMountain, drawCar]
  );

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    if (type === "success") {
      toast.success(message, {
        position: "top-center",
        style: {
          background: "#10B981",
          color: "#fff",
        },
      });
    } else if (type === "error") {
      toast.error(message, {
        position: "top-center",
      });
    } else {
      toast(message, {
        position: "top-center",
      });
    }
  };

  // Rest of the component logic remains the same...
  const startGame = useCallback(() => {
    setGameState("driving");
    setMultiplier(1);
    multiplierRef.current = 1;
    carPositionRef.current = 0;
    initializeScene();


    console.log("Pending bet state__1", pendingBet)
    console.log("Placed Bet successfully__1", hasPlacedBet) 

    if (pendingBet && hasPlacedBet) {
      const betToPlace = currentBetRef.current || betAmount;
      if (balance >= betToPlace) {
        setBalance((prev) => prev - betToPlace);
        setHasPlacedBet(true);
        setPendingBet(false);
        showNotification("Bet placed successfully!", "success");
      } else {
        setPendingBet(false);
        showNotification("Insufficient balance for pending bet!", "error");
      }
    }

    console.log("Pending bet state__2", pendingBet)
    console.log("Placed Bet successfully__2", hasPlacedBet) 

    crashPointRef.current = 1 + Math.random() * 9;

    const animate = () => {
      const currentMultiplier = multiplierRef.current;
      const increment = currentMultiplier < 10 ? 1 / 60 : 1 / 30;

      carPositionRef.current += increment * 100;
      multiplierRef.current += increment;
      setMultiplier(Number(multiplierRef.current.toFixed(2)));

      if (hasPlacedBet && multiplier >= autoCashOut) {
        handleCashOut();
        return;
      }

      drawScene();

      if (multiplierRef.current >= crashPointRef.current) {
        crashGame();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawScene, initializeScene]);

  const crashGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    drawScene(true);

    setHistory((prev) => [
      {
        multiplier: multiplierRef.current.toFixed(2),
        result: "crash",
        winnings: 0,
      },
      ...prev.slice(0, 4),
    ]);
    // Reset bet state when crashed
    // setHasPlacedBet(false);
    setGameState("crashed");
    setShowRestartAlert(true);

    // If there was a pending bet, keep it for next round
    if (pendingBet) {
      currentBetRef.current = betAmount;
    }

    setTimeout(() => {
      setShowRestartAlert(false);
      setGameState("waiting");
      startGame();
    }, 3000);
  }, [drawScene, startGame, betAmount]);

  const placeBet = useCallback(() => {
    if (balance < betAmount) {
      showNotification("Insufficient balance!", "error");
      return;
    }

    // Store the current bet amount for next round
    currentBetRef.current = betAmount;
      setHasPlacedBet(true);
      setPendingBet(true);
      showNotification("Bet queued for next round!", "info");

  }, [balance, betAmount, gameState]);


  const cancelBet = useCallback(() => {
    if (pendingBet) {
      setPendingBet(false);
      currentBetRef.current = 0;
      showNotification("Bet cancelled!", "info");
    }
  }, [pendingBet]);

const handleCashOut = useCallback(() => {
    if (!hasPlacedBet || gameState === "crashed") return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const winnings = betAmount * multiplier;
    setBalance((prev) => prev + winnings);
    showNotification(
      `Cashed out at ${multiplier}x! Won $${winnings.toFixed(2)}`,
      "success"
    );

    setHistory((prev) => [
      {
        multiplier: multiplierRef.current.toFixed(2),
        result: "cash_out",
        winnings,
      },
      ...prev.slice(0, 4),
    ]);

    setHasPlacedBet(false);
    setPendingBet(false);
    currentBetRef.current = 0;
    startGame();
  }, [betAmount, multiplier, hasPlacedBet, gameState, startGame]);

  useEffect(() => {
    startGame();
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [startGame]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 p-4">
      <Toaster />
      <canvas
        ref={canvasRef}
        className="w-full h-64 mb-4 rounded-lg bg-gray-200"
        width={800}
        height={300}
      />
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Coins className="text-yellow-400 w-6 h-6" />
            <span>Balance: ${balance.toFixed(2)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Car className="text-green-400 w-6 h-6" />
            <span>Multiplier: {multiplier.toFixed(2)}x</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Bet Amount</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md bg-white/20 text-white placeholder-white/50"
              placeholder="Enter bet amount"
            />
          </div>
          <div>
            <label className="block mb-2">Auto Cash Out</label>
            <input
              type="number"
              value={autoCashOut}
              onChange={(e) => setAutoCashOut(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md bg-white/20 text-white placeholder-white/50"
              placeholder="Enter auto cash out"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <button
              onClick={
                pendingBet
                  ? cancelBet
                  : hasPlacedBet && gameState !== "crashed"
                  ? handleCashOut
                  : placeBet
              }
              className="w-full bg-green-500 hover:bg-green-600 transition-colors text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {pendingBet
                ? "Cancel Bet"
                : hasPlacedBet && gameState !== "crashed"
                ? "Cash Out"
                : "Bet"}
            </button>
          </div>
        </div>
        {showRestartAlert && (
          <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="text-yellow-500 w-6 h-6" />
            <span>Game Over! Restarting...</span>
          </div>
        )}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Game History</h2>
          <ul className="space-y-2">
            {history.map((entry, index) => (
              <li key={index} className="bg-white/10 p-3 rounded-lg">
                <span className="font-medium">Multiplier:</span>{" "}
                {entry.multiplier}x,{" "}
                <span className="font-medium">Result:</span> {entry.result},{" "}
                <span className="font-medium">Winnings:</span> $
                {entry.winnings.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CarMultiplierGame;
