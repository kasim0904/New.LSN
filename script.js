// Somali Highway Racer - Part 1: Setup & Touch Controls

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. UI Elements
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

// 2. Engine State Variables
let isGameRunning = false;
let isPaused = false;
let animationFrameId;

let score = 0;
let coins = 0;
let baseSpeed = 6;
let currentSpeed = baseSpeed;
let roadOffset = 0;

// 3. Nitro System
let nitroAmount = 100;
let isNitroActive = false;
const maxNitro = 100;

// 4. Player Object
const player = {
  x: canvas.width / 2 - 21,
  y: canvas.height - 120,
  width: 42,
  height: 75,
  color: '#38bdf8',
  speedX: 0,
  speedY: 0,
  accel: 0.8,
  friction: 0.82
};

// 5. Touch System (Sida Talefanka loogu maamulo)
let touchStartX = null;
let touchStartY = null;

canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (!touchStartX || !touchStartY || !isGameRunning) return;

  const touch = e.touches[0];
  const diffX = touch.clientX - touchStartX;
  const diffY = touch.clientY - touchStartY;

  // Dhaqdhaqaaqa farta lagu jiido
  player.x += diffX * 0.15;
  player.y += diffY * 0.15;

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

canvas.addEventListener('touchend', () => {
  touchStartX = null;
  touchStartY = null;
});
// Somali Highway Racer - Part 2: Physics & Drawing Engines

// 6. Physics & Boundaries
function updatePlayerPhysics() {
  if (nitroAmount < maxNitro) nitroAmount += 0.15;
  nitroBar.style.width = `${(nitroAmount / maxNitro) * 100}%`;

  player.x += player.speedX;
  player.y += player.speedY;
  player.speedX *= player.friction;
  player.speedY *= player.friction;

  const roadMarginLeft = 50;
  const roadMarginRight = canvas.width - 50 - player.width;

  if (player.x < roadMarginLeft) player.x = roadMarginLeft;
  if (player.x > roadMarginRight) player.x = roadMarginRight;
  if (player.y < 20) player.y = 20;
  if (player.y > canvas.height - player.height - 20) {
    player.y = canvas.height - player.height - 20;
  }
}

// 7. Road Graphics & Animation
function drawRoad() {
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const roadWidth = canvas.width - 100;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(50, 0, roadWidth, canvas.height);

  const kerbWidth = 10;
  roadOffset = (roadOffset + currentSpeed) % 40;

  for (let y = -40; y < canvas.height; y += 40) {
    ctx.fillStyle = (Math.floor((y + roadOffset) / 40) % 2 === 0) ? '#ef4444' : '#ffffff';
    ctx.fillRect(40, y + roadOffset, kerbWidth, 40);
    ctx.fillRect(canvas.width - 50, y + roadOffset, kerbWidth, 40);
  }

  ctx.fillStyle = '#f8fafc';
  const laneGap = roadWidth / 3;

  for (let y = -40; y < canvas.height; y += 50) {
    ctx.fillRect(50 + laneGap - 3, y + roadOffset, 6, 25);
    ctx.fillRect(50 + (laneGap * 2) - 3, y + roadOffset, 6, 25);
  }
}

// 8. Player Car Render
function drawPlayerCar() {
  ctx.save();

  if (isNitroActive) {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(player.x + 12, player.y + player.height + 6, 6 + Math.random() * 4, 0, Math.PI * 2);
    ctx.arc(player.x + player.width - 12, player.y + player.height + 6, 6 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.width, player.height, 10);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(player.x + 6, player.y + 18, player.width - 12, 22);

  ctx.fillStyle = isNitroActive ? '#38bdf8' : '#facc15';
  ctx.fillRect(player.x + 4, player.y + 2, 8, 5);
  ctx.fillRect(player.x + player.width - 12, player.y + 2, 8, 5);

  ctx.restore();
}
// Somali Highway Racer - Part 3: Traffic, Items & Collision Logic

let trafficCars = [];
let coinsList = [];
let spawnTimer = 0;

// 9. Spawning Traffic Cars
function spawnTraffic() {
  const lanes = [110, 240, 370];
  const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  trafficCars.push({
    x: randomLane - 21,
    y: -80,
    width: 42,
    height: 75,
    speed: Math.random() * 2 + 3,
    color: randomColor
  });
}

// 10. Spawning Collectible Coins
function spawnCoin() {
  const lanes = [110, 240, 370];
  const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

  coinsList.push({
    x: randomLane,
    y: -30,
    radius: 10
  });
}

// 11. Collisions & Scoring Systems
function checkCollisions() {
  // Traffic Collision Check
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

  // Coin Collection Check
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
// Somali Highway Racer - Part 4: Game Loop & Control Functions

// 12. Main Game Loop Engine
function gameLoop() {
  if (!isGameRunning || isPaused) return;

  // Clear Screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render Base Environment
  drawRoad();
  updatePlayerPhysics();
  drawPlayerCar();

  // Spawning Objects
  spawnTimer++;
  if (spawnTimer % 90 === 0) spawnTraffic();
  if (spawnTimer % 140 === 0) spawnCoin();

  // Move & Draw Enemy Cars
  for (let i = trafficCars.length - 1; i >= 0; i--) {
    let car = trafficCars[i];
    car.y += currentSpeed - car.speed;

    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(car.x, car.y, car.width, car.height, 8);
    ctx.fill();

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

  // Check Collisions & Points
  checkCollisions();
  score += Math.floor(currentSpeed / 2);
  scoreVal.innerText = score;
  speedVal.innerText = Math.floor(currentSpeed * 15);

  animationFrameId = requestAnimationFrame(gameLoop);
}

// 13. State Handlers
function startGame() {
  menuModal.classList.add('hidden');
  garageModal.classList.add('hidden');
  gameOverModal.classList.add('hidden');

  score = 0;
  coins = 0;
  trafficCars = [];
  coinsList = [];
  player.x = canvas.width / 2 - 21;
  player.y = canvas.height - 120;
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

// 14. Button Event Listeners
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

                  
