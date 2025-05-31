"use client";
import { GameHistoryItem, GameState } from "@/lib/types/bet";
import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export const useGameSocket = () => {
  const [socketMultiplier, setSocketMultiplier] = useState<number | null>(null);
  const [socketGameState, setSocketGameState] = useState<GameState | null>(null);
  const [socketHistory, setSocketHistory] = useState<GameHistoryItem[] | null>(null);
  const [socketCrashPoint, setSocketCrashPoint] = useState<number | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  
  const socketRef = useRef<Socket | null>(null);
  
  // Define connection URL based on environment
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://1xdrives.com";
  
  // Initialize WebSocket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current) return;
    
    console.log('Connecting to Socket.IO server...');
    const socket = io(socketUrl);
    
    socket.on('connect', () => {
      console.log('Socket.IO connected');
      setConnected(true);
    });
    
    socket.on('game_state', (data) => {
      setSocketGameState(data.state);
    });
    
    socket.on('multiplier', (data) => {
      setSocketMultiplier(data.value);
    });
    
    socket.on('crash_point', (data) => {
      setSocketCrashPoint(data.value);
    });
    
    socket.on('history', (data) => {
      setSocketHistory(data.items);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setConnected(false);
    });
    
    socketRef.current = socket;
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [socketUrl]);

  // Send message to WebSocket
  const sendMessage = useCallback((message: any) => {
    if (!socketRef.current) {
      console.error('Socket.IO is not connected');
      return false;
    }
    
    try {
      socketRef.current.emit(message.type, message);
      return true;
    } catch (err) {
      console.error('Error sending Socket.IO message:', err);
      return false;
    }
  }, []);
  
  // Initialize Socket.IO on component mount
  useEffect(() => {
    initializeSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket]);
  
  return {
    connected,
    socketMultiplier,
    socketGameState,
    socketHistory,
    socketCrashPoint,
    sendMessage,
  };
};