// script.js - Somali Highway Racer (Game Engine Core & Player Physics)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

// Game Engine State
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

// Player Object & Physics
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 120,
  width: 42,
  height: 75,
  color: '#38bdf8', // Default Blue
  speedX: 0,
  speedY: 0,
  maxSpeed: 7,
  accel: 0.6,
  friction: 0.85
};

// Input Handling (Keyboard & Controls)
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  KeyA: false,
  KeyD: false,
  KeyW: false,
  KeyS: false,
  Space: false
};

window.addEventListener('keydown', (e) => {
  if (e.code in keys || e.key in keys) {
    keys[e.code] = true;
    keys[e.key] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code in keys || e.key in keys) {
    keys[e.code] = false;
    keys[e.key] = false;
  }
});

// Update Player Physics
function updatePlayerPhysics() {
  const moveLeft = keys.ArrowLeft || keys.KeyA;
  const moveRight = keys.ArrowRight || keys.KeyD;
  const moveUp = keys.ArrowUp || keys.KeyW;
  const moveDown = keys.ArrowDown || keys.KeyS;
  const nitroKey = keys.Space;

  // Nitro Boost Logic
  if (nitroKey && nitroAmount > 0) {
    isNitroActive = true;
    currentSpeed = baseSpeed * 1.8;
    nitroAmount -= 0.8;
    if (nitroAmount < 0) nitroAmount = 0;
  } else {
    isNitroActive = false;
    currentSpeed = baseSpeed;
    if (nitroAmount < maxNitro) nitroAmount += 0.15; // Recharge slowly
  }
  
  // Update Nitro UI Gauge
  nitroBar.style.width = `${(nitroAmount / maxNitro) * 100}%`;

  // Horizontal Acceleration & Friction
  if (moveLeft) player.speedX -= player.accel;
  if (moveRight) player.speedX += player.accel;
  player.speedX *= player.friction;
  player.x += player.speedX;

  // Vertical Acceleration & Friction
  if (moveUp) player.speedY -= player.accel;
  if (moveDown) player.speedY += player.accel;
  player.speedY *= player.friction;
  player.y += player.speedY;

  // Track Boundaries (Keeping car inside asphalt)
  const roadMarginLeft = 50;
  const roadMarginRight = canvas.width - 50 - player.width;

  if (player.x < roadMarginLeft) {
    player.x = roadMarginLeft;
    player.speedX = 0;
  }
  if (player.x > roadMarginRight) {
    player.x = roadMarginRight;
    player.speedX = 0;
  }

  if (player.y < 20) player.y = 20;
  if (player.y > canvas.height - player.height - 20) {
    player.y = canvas.height - player.height - 20;
  }
}

// Render Road, Lanes, and Grass Borders
function drawRoad() {
  // Grass/Desert Outskirts
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Main Asphalt Road
  const roadWidth = canvas.width - 100;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(50, 0, roadWidth, canvas.height);

  // Red/White Side Kerbs
  const kerbWidth = 10;
  roadOffset = (roadOffset + currentSpeed) % 40;

  for (let y = -40; y < canvas.height; y += 40) {
    ctx.fillStyle = (Math.floor((y + roadOffset) / 40) % 2 === 0) ? '#ef4444' : '#ffffff';
    ctx.fillRect(40, y + roadOffset, kerbWidth, 40);
    ctx.fillRect(canvas.width - 50, y + roadOffset, kerbWidth, 40);
  }

  // White Moving Dash Lanes (3 Lanes = 2 Lines)
  ctx.fillStyle = '#f8fafc';
  const laneGap = roadWidth / 3;

  for (let y = -40; y < canvas.height; y += 50) {
    ctx.fillRect(50 + laneGap - 3, y + roadOffset, 6, 25);
    ctx.fillRect(50 + (laneGap * 2) - 3, y + roadOffset, 6, 25);
  }
}

// Draw Custom Detailed Player Car
function drawPlayerCar() {
  ctx.save();

  // Nitro Exhaust Flame Effect
  if (isNitroActive) {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(player.x + 12, player.y + player.height + 6, 6 + Math.random() * 4, 0, Math.PI * 2);
    ctx.arc(player.x + player.width - 12, player.y + player.height + 6, 6 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Car Body
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.width, player.height, 10);
  ctx.fill();

  // Roof / Windshield
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(player.x + 6, player.y + 18, player.width - 12, 22);

  // Headlights
  ctx.fillStyle = isNitroActive ? '#38bdf8' : '#facc15';
  ctx.fillRect(player.x + 4, player.y + 2, 8, 5);
  ctx.fillRect(player.x + player.width - 12, player.y + 2, 8, 5);

  ctx.restore();
  }
