import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Define types
interface HistoryItem {
  multiplier: string;
  timestamp: number;
}

interface HistoryData {
  type: string;
  items: HistoryItem[];
}

// Helper function to determine badge color based on multiplier value
const getBadgeColor = (value: string): string => {
  const numValue = parseFloat(value);
  if (numValue < 2) return "text-blue-500";
  if (numValue < 5) return "text-purple-500";
  if (numValue < 10) return "text-green-500";
  return "text-red-500";
};

export default function MultiplierHistory(): JSX.Element {
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to the server
    const socketConnection = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000");
    setSocket(socketConnection);

    // Set up socket event listeners
    socketConnection.on('history', (data: HistoryData) => {
      if (data.type === 'history' && Array.isArray(data.items)) {
        // Extract just the multiplier values from the history items
        const multipliers = data.items.map(item => item.multiplier);
        setHistoryItems(multipliers);
        console.log("History received:", multipliers);
      }
    });

    // Request history immediately after connection
    socketConnection.on('connect', () => {
      console.log("Connected to server");
      // Optional: explicitly request history if server supports this
      // socketConnection.emit('get_history');
    });

    // Clean up socket connection on unmount
    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  return (
    <div className="w-full overflow-hidden bg-gray-800 p-2 rounded-lg">
      <div className="flex overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex space-x-2">
          {historyItems.length > 0 ? (
            historyItems.map((multiplier, index) => (
              <div 
                key={index} 
                className={`flex-shrink-0 px-2 py-1 rounded font-medium text-sm ${getBadgeColor(multiplier)}`}
              >
                {parseFloat(multiplier).toFixed(2)}x
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm">Waiting for game history...</div>
          )}
        </div>
      </div>
    </div>
  );
}