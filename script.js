// Somali Highway Racer - Part 1: Setup & Touch Engine

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas Responsive Setup
function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth - 20, 420);
  canvas.height = window.innerHeight * 0.75;
}
resizeCanvas();

// UI Elements
const scoreVal = document.getElementById('scoreVal');
const coinsVal = document.getElementById('coinsVal');
const speedVal = document.getElementById('speedVal');
const nitroBar = document.getElementById('nitroBar');

const menuModal = document.getElementById('menuModal');
const garageModal = document.getElementById('garageModal');
const gameOverModal = document.getElementById('gameOverModal');

const startPlayBtn = document.getElementById('startPlayBtn');
const openGarageBtn = document.getElementById('openGarageBtn');
const closeGarageBtn = document.getElementById('closeGarageBtn');
const restartGameBtn = document.getElementById('restartGameBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Engine State
let isGameRunning = false;
let isPaused = false;
let animationFrameId;

let score = 0;
let coins = 0;
let baseSpeed = 6;
let currentSpeed = baseSpeed;
let roadOffset = 0;

// Nitro System
let nitroAmount = 100;
let isNitroActive = false;
const maxNitro = 100;

// Player Object
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 110,
  width: 40,
  height: 70,
  color: '#38bdf8'
};

// Smooth Mobile Touch Controls
let isTouching = false;
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  if (!isGameRunning) return;
  isTouching = true;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  touchStartX = touch.clientX - rect.left;
  touchStartY = touch.clientY - rect.top;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (!isTouching || !isGameRunning) return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const touchX = touch.clientX - rect.left;
  const touchY = touch.clientY - rect.top;

  const moveX = touchX - touchStartX;
  const moveY = touchY - touchStartY;

  player.x += moveX;
  player.y += moveY;

  touchStartX = touchX;
  touchStartY = touchY;
}, { passive: true });

canvas.addEventListener('touchend', () => {
  isTouching = false;
});
// Somali Highway Racer - Part 2: Physics & Rendering Engines

// 6. Player Physics & Road Boundaries
function updatePlayerPhysics() {
  if (nitroAmount < maxNitro && !isNitroActive) nitroAmount += 0.15;
  nitroBar.style.width = `${(nitroAmount / maxNitro) * 100}%`;

  const roadMarginLeft = 45;
  const roadMarginRight = canvas.width - 45 - player.width;

  // X-axis limits (Hagaajinta xadka wadada)
  if (player.x < roadMarginLeft) player.x = roadMarginLeft;
  if (player.x > roadMarginRight) player.x = roadMarginRight;

  // Y-axis limits
  if (player.y < 20) player.y = 20;
  if (player.y > canvas.height - player.height - 20) {
    player.y = canvas.height - player.height - 20;
  }
}

// 7. Dynamic Road & Lane Graphics
function drawRoad() {
  // cawska dhinacyada
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Jidka laamiga ah
  const roadWidth = canvas.width - 80;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(40, 0, roadWidth, canvas.height);

  // Dhagaxyada cas iyo caddaan ka ah (Kerbs)
  const kerbWidth = 8;
  roadOffset = (roadOffset + currentSpeed) % 40;

  for (let y = -40; y < canvas.height; y += 40) {
    ctx.fillStyle = (Math.floor((y + roadOffset) / 40) % 2 === 0) ? '#ef4444' : '#ffffff';
    ctx.fillRect(32, y + roadOffset, kerbWidth, 40);
    ctx.fillRect(canvas.width - 40, y + roadOffset, kerbWidth, 40);
  }

  // Khadadka caddaanka ah ee kala saara labada haad
  ctx.fillStyle = '#f8fafc';
  const laneGap = roadWidth / 3;

  for (let y = -40; y < canvas.height; y += 50) {
    ctx.fillRect(40 + laneGap - 2, y + roadOffset, 4, 25);
    ctx.fillRect(40 + (laneGap * 2) - 2, y + roadOffset, 4, 25);
  }
}

// 8. Draw Player Car Graphics
function drawPlayerCar() {
  ctx.save();

  // Dabka Nitro-da
  if (isNitroActive) {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + player.height + 5, 5 + Math.random() * 4, 0, Math.PI * 2);
    ctx.arc(player.x + player.width - 10, player.y + player.height + 5, 5 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Jirka Baabuurka
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.width, player.height, 10);
  ctx.fill();

  // Muraayadda hore
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(player.x + 5, player.y + 16, player.width - 10, 20);

  // Nalalka Hore
  ctx.fillStyle = isNitroActive ? '#38bdf8' : '#facc15';
  ctx.fillRect(player.x + 3, player.y + 2, 8, 4);
  ctx.fillRect(player.x + player.width - 11, player.y + 2, 8, 4);

  ctx.restore();
}
// Somali Highway Racer - Part 3: Traffic, Items & Collision Engine

let trafficCars = [];
let coinsList = [];
let spawnTimer = 0;

// 9. Spawning Traffic Cars (Kala bixinta baabuurta si aysan isku dhex samaysmin)
function spawnTraffic() {
  const lanes = [80, 190, 300]; // 3-da haad ee wadada
  const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  // Hubi in haadkan uusan ku jirin baabuur aad u dhow
  const isLaneOccupied = trafficCars.some(car => car.x === (randomLane - 20) && car.y < 120);

  if (!isLaneOccupied) {
    trafficCars.push({
      x: randomLane - 20,
      y: -90,
      width: 40,
      height: 70,
      speed: Math.random() * 2 + 3,
      color: randomColor
    });
  }
}

// 10. Spawning Collectible Coins
function spawnCoin() {
  const lanes = [80, 190, 300];
  const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

  coinsList.push({
    x: randomLane,
    y: -30,
    radius: 10
  });
}

// 11. Collisions & Scoring Logic
function checkCollisions() {
  // Hubinta isku-dhaca baabuurta kale
  for (let i = 0; i < trafficCars.length; i++) {
    let car = trafficCars[i];
    if (
      player.x < car.x + car.width &&
      player.x + player.width > car.x &&
      player.y < car.y + car.height &&
      player.y + player.height > car.y
    ) {
      endGame();
    }
  }

  // Hubinta soo uruurinta luulka / saraakiisha (Coins)
  for (let i = coinsList.length - 1; i >= 0; i--) {
    let gold = coinsList[i];
    let dist = Math.hypot((player.x + player.width / 2) - gold.x, (player.y + player.height / 2) - gold.y);

    if (dist < player.width / 2 + gold.radius) {
      coins += 10;
      coinsVal.innerText = coins;
      coinsList.splice(i, 1);
    }
  }
}
// Somali Highway Racer - Part 4: Game Loop & Controls Engine

// 12. Main Game Loop
function gameLoop() {
  if (!isGameRunning || isPaused) return;

  // Screen-ka nadiifi
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Soosaarista wadada iyo baabuurkaaga
  drawRoad();
  updatePlayerPhysics();
  drawPlayerCar();

  // Spawning Timers
  spawnTimer++;
  if (spawnTimer % 80 === 0) spawnTraffic();
  if (spawnTimer % 130 === 0) spawnCoin();

  // Move & Draw Enemy Cars
  for (let i = trafficCars.length - 1; i >= 0; i--) {
    let car = trafficCars[i];
    car.y += currentSpeed - car.speed + 2;

    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(car.x, car.y, car.width, car.height, 8);
    ctx.fill();

    // Muraayada baabuurta cadowga ah
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(car.x + 5, car.y + car.height - 22, car.width - 10, 16);

    if (car.y > canvas.height + 100) {
      trafficCars.splice(i, 1);
    }
  }

  // Move & Draw Coins
  for (let i = coinsList.length - 1; i >= 0; i--) {
    let gold = coinsList[i];
    gold.y += currentSpeed;

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(gold.x, gold.y, gold.radius, 0, Math.PI * 2);
    ctx.fill();

    if (gold.y > canvas.height + 50) {
      coinsList.splice(i, 1);
    }
  }

  // Check Collisions & Score Updates
  checkCollisions();
  score += Math.floor(currentSpeed / 2);
  scoreVal.innerText = score;
  speedVal.innerText = Math.floor(currentSpeed * 15);

  animationFrameId = requestAnimationFrame(gameLoop);
}

// 13. Game States
function startGame() {
  menuModal.classList.add('hidden');
  garageModal.classList.add('hidden');
  gameOverModal.classList.add('hidden');

  score = 0;
  coins = 0;
  trafficCars = [];
  coinsList = [];
  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 110;
  isGameRunning = true;
  isPaused = false;

  gameLoop();
}

function endGame() {
  isGameRunning = false;
  cancelAnimationFrame(animationFrameId);

  document.getElementById('finalScore').innerText = score;
  document.getElementById('finalCoins').innerText = coins;
  gameOverModal.classList.remove('hidden');
}

// 14. Event Listeners (Batoonada UI-ga)
startPlayBtn.addEventListener('click', startGame);
restartGameBtn.addEventListener('click', startGame);

openGarageBtn.addEventListener('click', () => {
  menuModal.classList.add('hidden');
  garageModal.classList.remove('hidden');
});

closeGarageBtn.addEventListener('click', () => {
  garageModal.classList.add('hidden');
  menuModal.classList.remove('hidden');
});

backToMenuBtn.addEventListener('click', () => {
  gameOverModal.classList.add('hidden');
  menuModal.classList.remove('hidden');
});

pauseBtn.addEventListener('click', () => {
  if (!isGameRunning) return;
  isPaused = !isPaused;
  if (!isPaused) gameLoop();
});
