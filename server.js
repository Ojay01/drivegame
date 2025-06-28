// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;


  let gameState = 'betting'; // Initial game state
  let multiplier = 1; // Initial multiplier
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  const history = [];


  io.on('connection', (socket) => {
    console.log('Client connected');
    
      socket.emit('history', { type: 'history', items: history });
        socket.emit('game_state', { type: 'game_state', state: gameState });

    socket.on('place_bet', (data) => {
      console.log('Bet placed:', data);
    });
    socket.on('cash_out', (data) => {
      console.log('Cash out:', data);
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Start game simulation
  startGameCycle(io, history);

  server.listen(PORT, (err) => {
    if (err) {
      console.error('Server error:', err);
      process.exit(1);
    }
    console.log(`> Ready on http://localhost:${PORT} [${dev ? 'dev' : 'prod'}]`);
  });
});

function startGameCycle(io, history) {
  let crashPoint = 0;

  const runGameCycle = () => {
    gameState = 'betting';
    io.emit('game_state', { type: 'game_state', state: gameState });
    io.emit('multiplier', { type: 'multiplier', value: 1 });

    setTimeout(() => {
      // Step 1: Emit lockbets state (lasts ~1ms)
      gameState = 'lockbets';
      io.emit('game_state', { type: 'game_state', state: gameState });

      setTimeout(() => {
        // Step 2: Start driving state
        gameState = 'driving';
        multiplier = 1;
        crashPoint = generateCrashPoint();

        io.emit('game_state', { type: 'game_state', state: gameState });
        io.emit('crash_point', { type: 'crash_point', value: crashPoint });

        const multiplierInterval = setInterval(() => {
          const increment = multiplier < 5 ? 0.02 : multiplier < 10 ? 0.03 : 0.05;
          multiplier = Number((multiplier + increment).toFixed(2));

          io.emit('multiplier', { type: 'multiplier', value: multiplier });

          if (multiplier >= crashPoint) {
            clearInterval(multiplierInterval);
            gameState = 'crashed';
            io.emit('game_state', { type: 'game_state', state: gameState });

            history.unshift({
              multiplier: multiplier.toFixed(2),
              result: 'crash',
              winnings: 0
            });

            if (history.length > 50) history.pop();
            io.emit('history', { type: 'history', items: history });

            setTimeout(runGameCycle, 1500);
          }
        }, 50);
      }, 300); // lockbets lasts 1 millisecond
    }, 6000); // betting lasts 6 seconds
  };

  // Function to generate crash point with 30/70 house edge
  function generateCrashPoint() {
    const random = Math.random();
    
    // 70% chance of lower multiplier (1 to 2.5)
    if (random < 0.7) {
      return 1 + (Math.random() * 1.5); // Range: 1.0 to 2.5
    } 
    // 22% chance of medium multiplier (2.5 to 8)
    else if (random < 0.92) {
      return 2.5 + (Math.random() * 5.5); // Range: 2.5 to 8.0
    } 
    // 6% chance of higher multiplier (8 to 10)
    else if (random < 0.98) {
      return 8 + (Math.random() * 2); // Range: 8.0 to 10.0
    }
    // 2% chance of very high multiplier (10 to 50)
    else {
      return 10 + (Math.random() * 40); // Range: 10.0 to 50.0
    }
  }

  runGameCycle();
}