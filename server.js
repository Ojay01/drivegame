const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { getDrivesSettings } = require('./lib/settings');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

let gameState = 'betting';
let multiplier = 1;

let gameSettings = {
  max_number: 100,
  next_round_number: 1,
  mode: 'normal',
};

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
  });

  server.listen(PORT, (err) => {
    if (err) {
      console.error('Server error:', err);
      process.exit(1);
    }
    console.log(`> Ready on http://localhost:${PORT} [${dev ? 'dev' : 'prod'}]`);
  });

  fetchGameSettings().then(() => {
    startGameCycle(io, history);
  });
});


async function fetchGameSettings() {
  try {
    const settings = await getDrivesSettings();

    if (!settings) {
      console.warn("No settings returned, using defaults");
      return;
    }

    gameSettings.max_number = settings.max_number || 10;
    gameSettings.mode = settings.mode || 'normal';
    gameSettings.next_round_number = settings.next_round_number || 1;

    console.log('Game settings loaded:', gameSettings);
  } catch (err) {
    console.error('Failed to load game settings:', err.message);
  }
}



function startGameCycle(io, history) {
  const runGameCycle = async () => {
    await fetchGameSettings();

    gameState = 'betting';
    io.emit('game_state', { type: 'game_state', state: gameState });
    io.emit('multiplier', { type: 'multiplier', value: 1 });

    setTimeout(() => {
      gameState = 'lockbets';
      io.emit('game_state', { type: 'game_state', state: gameState });

      setTimeout(() => {
        gameState = 'driving';
        multiplier = 1;

        const crashPoint = generateCrashPoint(gameSettings.mode, gameSettings.max_number);

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
              winnings: 0,
            });

            if (history.length > 50) history.pop();
            io.emit('history', { type: 'history', items: history });

            setTimeout(runGameCycle, 1500); // Next round
          }
        }, 50);
      }, 300);
    }, 6000);
  };

  runGameCycle();
}


function generateCrashPoint(mode = 'normal', max = 50) {
  if (gameSettings.next_round_number && gameSettings.next_round_number > 1) {
    const fixedCrash = parseFloat(Math.min(gameSettings.next_round_number, max).toFixed(2));
    gameSettings.next_round_number = 1;
    return fixedCrash;
  }

  const rand = Math.random();
  let crash;

  if (rand < 0.7) {
    crash = 1 + Math.random() * 1.5;
  } else if (rand < 0.92) {
    crash = 2.5 + Math.random() * 5.5;
  } else if (rand < 0.98) {
    crash = 8 + Math.random() * 2;
  } else {
    crash = 10 + Math.random() * 40;
  }

  const adjusted = applyModeToCrash(mode, crash, max);
  return parseFloat(Math.min(adjusted, max).toFixed(2));
  
}



function applyModeToCrash(mode, value, max) {
  const skewedRandom = (exponent) => {
    return Math.pow(Math.random(), exponent) * (max - 1) + 1;
  };

  switch (mode) {
    case 'super_easy':
      return Math.max(value, skewedRandom(0.3));
    case 'easy':
      return Math.max(value, skewedRandom(0.6)); 
    case 'normal':
      return Math.min(value, skewedRandom(1.2));
    case 'hard':
      return Math.min(value, skewedRandom(2)); 
    case 'super_hard':
      return Math.min(value, skewedRandom(3)); 
    default:
      return value;
  }
}


