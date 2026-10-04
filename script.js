// Somali Highway Racer - Strict Boundary & Maximum Traffic Pressure Engine

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dynamic Canvas Setup
function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth - 20, 420);
  canvas.height = window.innerHeight * 0.75;
}
resizeCanvas();

// UI References
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

// Engine Variables
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

// Fixed Road Layout & Exact Center Alignments
const ROAD_LEFT = 45;
const ROAD_WIDTH = canvas.width - 90;
const ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH;

// Calculation for 3 Distinct Lanes (Centered in Road)
function getLanePositions() {
  const laneGap = ROAD_WIDTH / 3;
  return [
    ROAD_LEFT + (laneGap * 0.5) - 20, // Haadka Bidix (Exact Center)
    ROAD_LEFT + (laneGap * 1.5) - 20, // Haadka Dhexe (Exact Center)
    ROAD_LEFT + (laneGap * 2.5) - 20  // Haadka Midig (Exact Center)
  ];
}

// Mobile Touch Controls
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

// Player Movement & Absolute Boundary Lockdown (Khaas ah: Safe-spot Elimination)
function updatePlayerPhysics() {
  if (nitroAmount < maxNitro && !isNitroActive) nitroAmount += 0.15;
  nitroBar.style.width = `${(nitroAmount / maxNitro) * 100}%`;

  const lanes = getLanePositions();
  
  // WAXAA DHIBAATADII SHAAFARAY: Player-ku ma ka tagi karo X-ka Haadka 1-aad ama kan 3-aad
  const minX = lanes[0]; // Xadka dhabta ah ee haadka ugu horreeya
  const maxX = lanes[2]; // Xadka dhabta ah ee haadka ugu dambeeya

  if (player.x < minX) player.x = minX;
  if (player.x > maxX) player.x = maxX;

  if (player.y < 20) player.y = 20;
  if (player.y > canvas.height - player.height - 20) {
    player.y = canvas.height - player.height - 20;
  }
}

// Visual Road System
function drawRoad() {
  ctx.fillStyle = '#15803d'; // Green Grass Margin
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1e293b'; // Main Asphalt Road
  ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, canvas.height);

  const kerbWidth = 8;
  roadOffset = (roadOffset + currentSpeed) % 40;

  // Red/White Side Kerbs
  for (let y = -40; y < canvas.height; y += 40) {
    ctx.fillStyle = (Math.floor((y + roadOffset) / 40) % 2 === 0) ? '#ef4444' : '#ffffff';
    ctx.fillRect(ROAD_LEFT - kerbWidth, y + roadOffset, kerbWidth, 40);
    ctx.fillRect(ROAD_RIGHT, y + roadOffset, kerbWidth, 40);
  }

  // White Lane Markers
  ctx.fillStyle = '#f8fafc';
  const laneGap = ROAD_WIDTH / 3;

  for (let y = -40; y < canvas.height; y += 50) {
    ctx.fillRect(ROAD_LEFT + laneGap - 2, y + roadOffset, 4, 25);
    ctx.fillRect(ROAD_LEFT + (laneGap * 2) - 2, y + roadOffset, 4, 25);
  }
}

// Player Car Visual Engine
function drawPlayerCar() {
  ctx.save();

  if (isNitroActive) {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + player.height + 5, 5 + Math.random() * 4, 0, Math.PI * 2);
    ctx.arc(player.x + player.width - 10, player.y + player.height + 5, 5 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.width, player.height, 10);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(player.x + 5, player.y + 16, player.width - 10, 20);

  ctx.fillStyle = isNitroActive ? '#38bdf8' : '#facc15';
  ctx.fillRect(player.x + 3, player.y + 2, 8, 4);
  ctx.fillRect(player.x + player.width - 11, player.y + 2, 8, 4);

  ctx.restore();
}

// AI Traffic & High Score Difficulty Scaling
let trafficCars = [];
let coinsList = [];
let spawnTimer = 0;

// Dynamic Density Scaling (Cadaadis Xad Dhaaf Ah > 8,000 score)
function getSpawnInterval() {
  if (score > 8000) {
    let reduction = Math.floor((score - 8000) / 300) * 6;
    return Math.max(14, 60 - reduction); // Baabuurta aad bay u soo batayaan marba marka ka dambaysa
  }
  return 75;
}

function spawnTraffic() {
  const lanes = getLanePositions();
  
  // Isku aadi spawning-ka si baabuurta oo dhan ay dhammaan haadadka u wada xiraan
  const randomIndex = Math.floor(Math.random() * lanes.length);
  const randomLane = lanes[randomIndex];
  
  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const isLaneOccupied = trafficCars.some(car => car.x === randomLane && car.y < 150);

  if (!isLaneOccupied) {
    let extraSpeed = score > 8000 ? Math.min(8, (score - 8000) / 1000) : 0;

    trafficCars.push({
      x: randomLane,
      y: -90,
      width: 40,
      height: 70,
      speed: (Math.random() * 2.5 + 2) + extraSpeed,
      color: randomColor
    });
  }
}

function spawnCoin() {
  const lanes = getLanePositions();
  const randomLane = lanes[Math.floor(Math.random() * lanes.length)] + 10;

  coinsList.push({
    x: randomLane,
    y: -30,
    radius: 10
  });
}

// Precise Collision Engine
function checkCollisions() {
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

// Game Loop Engine
function gameLoop() {
  if (!isGameRunning || isPaused) return;

  // Extreme Speed Boost Marka Score-ku uu Bato
  if (score > 8000) {
    currentSpeed = baseSpeed + Math.min(12, (score - 8000) / 1000);
  } else {
    currentSpeed = baseSpeed;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRoad();
  updatePlayerPhysics();
  drawPlayerCar();

  spawnTimer++;
  let currentSpawnRate = getSpawnInterval();
  
  if (spawnTimer % currentSpawnRate === 0) spawnTraffic();
  if (spawnTimer % 110 === 0) spawnCoin();

  for (let i = trafficCars.length - 1; i >= 0; i--) {
    let car = trafficCars[i];
    car.y += currentSpeed - car.speed + 1.5;

    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(car.x, car.y, car.width, car.height, 8);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(car.x + 5, car.y + car.height - 22, car.width - 10, 16);

    if (car.y > canvas.height + 100) {
      trafficCars.splice(i, 1);
    }
  }

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

  checkCollisions();
  score += Math.floor(currentSpeed / 2);
  scoreVal.innerText = score;
  speedVal.innerText = Math.floor(currentSpeed * 15);

  animationFrameId = requestAnimationFrame(gameLoop);
}

// UI & Game State Event Handlers
function startGame() {
  menuModal.classList.add('hidden');
  garageModal.classList.add('hidden');
  gameOverModal.classList.add('hidden');

  score = 0;
  coins = 0;
  trafficCars = [];
  coinsList = [];
  player.x = getLanePositions()[1]; // Middle Lane Startup
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

// UI Event Listeners
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
    
