// Shadow Hunter India - Game Implementation

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// HUD elements
const hudLevel = document.getElementById('hud-level');
const hudGems = document.getElementById('hud-gems');
const hudEnemies = document.getElementById('hud-enemies');
const messageDiv = document.getElementById('message');

// Game State
let gameState = {
  level: 1,
  score: 0,
  gemsCollected: 0,
  totalGems: 0,
  enemiesLeft: 0,
  gameOver: false,
  levelComplete: false
};

// Player
const player = {
  x: 50,
  y: 50,
  width: 30,
  height: 30,
  speed: 3,
  color: '#00ff00',
  dx: 0,
  dy: 0,
  isHidden: false
};

// Enemies
let enemies = [];

// Gems
let gems = [];

// Hiding spots
let hidingSpots = [];

// Keys pressed
const keys = {};

// Update HUD
function updateHUD() {
  hudLevel.textContent = gameState.level;
  hudGems.textContent = `${gameState.gemsCollected}/${gameState.totalGems}`;
  hudEnemies.textContent = gameState.enemiesLeft;
}

// Show message
function showMessage(text) {
  messageDiv.textContent = text;
  messageDiv.style.display = 'block';
}

function hideMessage() {
  messageDiv.style.display = 'none';
}

// Initialize level
function initLevel(level) {
  enemies = [];
  gems = [];
  hidingSpots = [];
  hideMessage();
  
  // Place player at start
  player.x = 50;
  player.y = 50;
  player.dx = 0;
  player.dy = 0;
  player.isHidden = false;
  
  // Create hiding spots
  const numHidingSpots = 3 + level;
  for (let i = 0; i < numHidingSpots; i++) {
    hidingSpots.push({
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * (canvas.height - 60) + 30,
      width: 50,
      height: 50,
      color: '#8B4513'
    });
  }
  
  // Create gems
  const numGems = 5 + level * 2;
  for (let i = 0; i < numGems; i++) {
    gems.push({
      x: Math.random() * (canvas.width - 20) + 10,
      y: Math.random() * (canvas.height - 20) + 10,
      width: 15,
      height: 15,
      color: '#FFD700',
      collected: false
    });
  }
  
  // Create enemies
  const numEnemies = 2 + level;
  for (let i = 0; i < numEnemies; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 40) + 20,
      y: Math.random() * (canvas.height - 40) + 20,
      width: 30,
      height: 30,
      speed: 1 + level * 0.3,
      color: '#ff0000',
      dx: (Math.random() - 0.5) * 2,
      dy: (Math.random() - 0.5) * 2,
      detectionRadius: 100 + level * 10,
      patrolAngle: Math.random() * Math.PI * 2,
      alive: true
    });
  }
  
  gameState.levelComplete = false;
  gameState.gemsCollected = 0;
  gameState.totalGems = numGems;
  gameState.enemiesLeft = numEnemies;
  updateHUD();
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// Update player position
function updatePlayer() {
  if (player.isHidden) return;
  
  player.dx = 0;
  player.dy = 0;
  
  if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
  if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
  if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
  if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
  
  // Update position
  player.x += player.dx;
  player.y += player.dy;
  
  // Keep player in bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
  
  // Check hiding spots
  player.isHidden = false;
  for (let spot of hidingSpots) {
    if (checkCollision(player, spot)) {
      player.isHidden = true;
      break;
    }
  }
  
  // Check gem collection
  for (let gem of gems) {
    if (!gem.collected && checkCollision(player, gem)) {
      gem.collected = true;
      gameState.gemsCollected++;
      gameState.score += 100;
      updateHUD();
    }
  }
  
  // Check if all gems collected
  if (gems.every(gem => gem.collected)) {
    gameState.levelComplete = true;
    showMessage(`Level ${gameState.level} Complete! Press SPACE for next level`);
  }
}

// Update enemy AI
function updateEnemies() {
  for (let enemy of enemies) {
    if (!enemy.alive) continue;
    
    // Calculate distance to player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If player is not hidden and within detection radius, chase
    if (!player.isHidden && distance < enemy.detectionRadius) {
      // Chase player
      const angle = Math.atan2(dy, dx);
      enemy.dx = Math.cos(angle) * enemy.speed;
      enemy.dy = Math.sin(angle) * enemy.speed;
    } else {
      // Patrol behavior
      enemy.patrolAngle += (Math.random() - 0.5) * 0.2;
      enemy.dx = Math.cos(enemy.patrolAngle) * enemy.speed * 0.5;
      enemy.dy = Math.sin(enemy.patrolAngle) * enemy.speed * 0.5;
    }
    
    // Update position
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;
    
    // Keep enemy in bounds and bounce off walls
    if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
      enemy.dx = -enemy.dx;
      enemy.patrolAngle = Math.PI - enemy.patrolAngle;
    }
    if (enemy.y <= 0 || enemy.y >= canvas.height - enemy.height) {
      enemy.dy = -enemy.dy;
      enemy.patrolAngle = -enemy.patrolAngle;
    }
    enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
    enemy.y = Math.max(0, Math.min(canvas.height - enemy.height, enemy.y));
    
    // Check collision with player (only if player is not hidden)
    if (!player.isHidden && checkCollision(player, enemy)) {
      gameState.gameOver = true;
      showMessage('Game Over! Press R to restart');
    }
  }
}

// Draw everything
function draw() {
  // Clear canvas
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw hiding spots
  for (let spot of hidingSpots) {
    ctx.fillStyle = spot.color;
    ctx.fillRect(spot.x, spot.y, spot.width, spot.height);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(spot.x, spot.y, spot.width, spot.height);
  }
  
  // Draw gems
  for (let gem of gems) {
    if (!gem.collected) {
      ctx.fillStyle = gem.color;
      ctx.beginPath();
      ctx.arc(gem.x + gem.width/2, gem.y + gem.height/2, gem.width/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  // Draw player
  if (player.isHidden) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
  } else {
    ctx.fillStyle = player.color;
  }
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.strokeStyle = '#00aa00';
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x, player.y, player.width, player.height);
  
  // Draw "HIDDEN" text if player is hidden
  if (player.isHidden) {
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x + player.width/2, player.y - 10);
  }
  
  // Draw enemies
  for (let enemy of enemies) {
    if (!enemy.alive) continue;
    
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Draw detection radius (if player not hidden and close enough)
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (!player.isHidden && distance < enemy.detectionRadius) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.detectionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Game loop
function gameLoop() {
  if (!gameState.gameOver && !gameState.levelComplete) {
    updatePlayer();
    updateEnemies();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  
  // Restart game
  if (e.key === 'r' || e.key === 'R') {
    if (gameState.gameOver) {
      gameState.level = 1;
      gameState.score = 0;
      gameState.gameOver = false;
      initLevel(1);
    }
  }
  
  // Next level
  if (e.key === ' ') {
    if (gameState.levelComplete) {
      gameState.level++;
      gameState.levelComplete = false;
      initLevel(gameState.level);
    }
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Start game when page loads
window.addEventListener('load', () => {
  initLevel(1);
  gameLoop();
});
