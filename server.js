// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Handle game events
    socket.on('place_bet', (data) => {
      console.log('Bet placed:', data);
      // Handle bet logic
      // You could broadcast this to other players if needed
    });

    socket.on('cash_out', (data) => {
      console.log('Cash out:', data);
      // Handle cash out logic and send back results
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Start game simulation
  startGameCycle(io);

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});

function startGameCycle(io) {
  let gameState = 'betting';
  let multiplier = 1;
  let crashPoint = 0;
  
  // History of past games
  const history = [];

  const runGameCycle = () => {
    // Betting phase (3 seconds)
    gameState = 'betting';
    io.emit('game_state', { type: 'game_state', state: gameState });
    io.emit('multiplier', { type: 'multiplier', value: 1 });
    
    setTimeout(() => {
      // Driving phase
      gameState = 'driving';
      multiplier = 1;
      crashPoint = 1 + Math.random() * 9; // Random crash point between 1 and 10
      
      io.emit('game_state', { type: 'game_state', state: gameState });
      io.emit('crash_point', { type: 'crash_point', value: crashPoint });
      
      // Start increasing multiplier
      const multiplierInterval = setInterval(() => {
        const increment = multiplier < 5 ? 0.02 : 
                         multiplier < 10 ? 0.03 : 0.05;
        
        multiplier += increment;
        multiplier = Number(multiplier.toFixed(2));
        io.emit('multiplier', { type: 'multiplier', value: multiplier });
        
        // Check if crashed
        if (multiplier >= crashPoint) {
          clearInterval(multiplierInterval);
          gameState = 'crashed';
          io.emit('game_state', { type: 'game_state', state: gameState });
          
          // Update history
          history.unshift({
            multiplier: multiplier.toFixed(2),
            result: 'crash',
            winnings: 0
          });
          
          if (history.length > 10) history.pop(); // Keep only 10 latest records
          io.emit('history', { type: 'history', items: history });
          
          // Start a new round after delay
          setTimeout(runGameCycle, 3000);
        }
      }, 50);
    }, 3000);
  };
  
  // Start the first game cycle
  runGameCycle();
}