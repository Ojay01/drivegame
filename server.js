// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

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

  io.on('connection', (socket) => {
    console.log('Client connected');

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
  startGameCycle(io);

  server.listen(PORT, (err) => {
    if (err) {
      console.error('Server error:', err);
      process.exit(1);
    }
    console.log(`> Ready on http://localhost:${PORT} [${dev ? 'dev' : 'prod'}]`);
  });
});

function startGameCycle(io) {
  let gameState = 'betting';
  let multiplier = 1;
  let crashPoint = 0;
  const history = [];

  const runGameCycle = () => {
    gameState = 'betting';
    io.emit('game_state', { type: 'game_state', state: gameState });
    io.emit('multiplier', { type: 'multiplier', value: 1 });

    setTimeout(() => {
      gameState = 'driving';
      multiplier = 1;
      crashPoint = 1 + Math.random() * 35;

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
          if (history.length > 10) history.pop();

          io.emit('history', { type: 'history', items: history });

          setTimeout(runGameCycle, 3000);
        }
      }, 50);
    }, 3000);
  };

  runGameCycle();
}
