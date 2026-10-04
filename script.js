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
