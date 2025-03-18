// DOM Elements
const content = document.getElementById('content');
const audioPlayer = document.getElementById('audioPlayer');
const playButton = document.getElementById('playButton');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// Robot control buttons
const ledButtons = document.querySelectorAll('.led-button');
const moveButtons = document.querySelectorAll('.move-button');
const neckButtons = document.querySelectorAll('.neck-button');

// Audio Context and Analyzer setup
let audioContext, analyser, dataArray, bufferLength;
let isPlaying = false;
let lastBeatTime = 0;
let beatThreshold = 200; // ms between beats
let beatDetected = false;

// Movement constants
const MOVE_SPEED = 70;
const MOVE_TIME = 300;

// Neck position constants
const NECK_POSITIONS = {
  up: 20,     // Looking up
  center: 50,  // Center position
  down: 80     // Looking down
};

// Ohmni Robot Control
const robotApi = {
  isConnected: false,
  colors: [
    {h: 0, s: 100, v: 100},    // Red
    {h: 120, s: 100, v: 100},  // Green
    {h: 240, s: 100, v: 100},  // Blue
    {h: 60, s: 100, v: 100},   // Yellow
    {h: 300, s: 100, v: 100},  // Purple
  ],
  currentColorIndex: 0,
  
  // Connect to robot
  connect: function() {
    try {
      if (typeof Ohmni !== 'undefined') {
        this.isConnected = true;
        console.log('Robot connected');
        this.resetPosition();
      } else {
        console.warn('Ohmni API not available');
      }
    } catch (error) {
      console.error('Error connecting to robot:', error);
    }
  },
  
  // Make robot dance based on beat intensity
  dance: function(intensity) {
    if (!this.isConnected) return;
    
    const speed = Math.floor(intensity * 80);
    Ohmni.move(speed, -speed, 300); // Turn quickly one way
    setTimeout(() => {
      Ohmni.move(-speed, speed, 300); // Then the other
    }, 300);
  },
  
  // Move robot's neck to beat
  shakeNeck: function(intensity) {
    if (!this.isConnected) return;
    
    // Current neck position plus random movement based on intensity
    const movement = Math.floor(intensity * 20) - 10;
    Ohmni.setNeckPosition(50 + movement, 10);
  },
  
  // Cycle LED colors
  cycleColor: function() {
    if (!this.isConnected) return;
    
    this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
    const color = this.colors[this.currentColorIndex];
    Ohmni.setLightColor(color.h, color.s, color.v);
  },
  
  // Set specific LED color
  setColor: function(colorName) {
    if (!this.isConnected) return;
    
    let h, s, v;
    
    switch(colorName) {
      case 'red':
        h = 0; s = 100; v = 100;
        break;
      case 'green':
        h = 120; s = 100; v = 100;
        break;
      case 'blue':
        h = 240; s = 100; v = 100;
        break;
      case 'yellow':
        h = 60; s = 100; v = 100;
        break;
      case 'purple':
        h = 300; s = 100; v = 100;
        break;
      case 'white':
      default:
        h = 0; s = 0; v = 100;
        break;
    }
    
    Ohmni.setLightColor(h, s, v);
  },
  
  // Move in a specific direction
  move: function(direction) {
    if (!this.isConnected) return;
    
    let leftSpeed = 0, rightSpeed = 0;
    
    switch(direction) {
      case 'forward':
        leftSpeed = MOVE_SPEED;
        rightSpeed = MOVE_SPEED;
        break;
      case 'backward':
        leftSpeed = -MOVE_SPEED;
        rightSpeed = -MOVE_SPEED;
        break;
      case 'left':
        leftSpeed = -MOVE_SPEED / 2;
        rightSpeed = MOVE_SPEED / 2;
        break;
      case 'right':
        leftSpeed = MOVE_SPEED / 2;
        rightSpeed = -MOVE_SPEED / 2;
        break;
      case 'stop':
      default:
        leftSpeed = 0;
        rightSpeed = 0;
        // Use longer time to ensure it stops
        Ohmni.move(0, 0, 100);
        return;
    }
    
    Ohmni.move(leftSpeed, rightSpeed, MOVE_TIME);
  },
  
  // Set neck position
  setNeckPosition: function(position) {
    if (!this.isConnected) return;
    
    let pos;
    switch(position) {
      case 'up':
        pos = NECK_POSITIONS.up;
        break;
      case 'down':
        pos = NECK_POSITIONS.down;
        break;
      case 'center':
      default:
        pos = NECK_POSITIONS.center;
        break;
    }
    
    Ohmni.setNeckPosition(pos, 30);
  },
  
  // Reset robot position
  resetPosition: function() {
    if (!this.isConnected) return;
    
    Ohmni.setNeckPosition(NECK_POSITIONS.center, 10); // Center position
    Ohmni.setLightColor(0, 0, 100); // White light
  }
};

// Initialize Audio Context
function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  
  // Connect audio player to analyzer
  const source = audioContext.createMediaElementSource(audioPlayer);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  
  // Set up analyzer
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  
  // Set canvas size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

// Draw beat visualizer
function drawVisualizer() {
  if (!audioContext) return;
  
  requestAnimationFrame(drawVisualizer);
  
  // Get frequency data
  analyser.getByteFrequencyData(dataArray);
  
  // Clear canvas
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculate average bass frequency (where beats usually are)
  let bassSum = 0;
  const bassRange = 8; // First few frequency bins for bass
  for (let i = 0; i < bassRange; i++) {
    bassSum += dataArray[i];
  }
  const bassAvg = bassSum / bassRange;
  
  // Beat detection
  const now = Date.now();
  if (bassAvg > 200 && now - lastBeatTime > beatThreshold) {
    beatDetected = true;
    lastBeatTime = now;
    
    // Control robot on beat
    const intensity = bassAvg / 255;
    robotApi.dance(intensity);
    robotApi.shakeNeck(intensity);
    robotApi.cycleColor();
  } else {
    beatDetected = false;
  }
  
  // Draw bars
  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] / 255 * canvas.height;
    
    // Color based on frequency and beat detection
    const hue = i / bufferLength * 360;
    const saturation = beatDetected ? '100%' : '70%';
    const lightness = beatDetected ? '50%' : '40%';
    
    ctx.fillStyle = `hsl(${hue}, ${saturation}, ${lightness})`;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    
    x += barWidth + 1;
  }
}

// Play/Pause audio
function togglePlay() {
  if (!audioContext) {
    initAudio();
    drawVisualizer();
    
    // Try to connect to robot
    robotApi.connect();
  }
  
  if (isPlaying) {
    audioPlayer.pause();
    playButton.textContent = 'Let\'s Dance!';
    isPlaying = false;
  } else {
    audioPlayer.play();
    playButton.textContent = 'Pause';
    isPlaying = true;
  }
}

// Example dynamic content
const data = {
  items: [
    { id: 1, text: 'Dance to the beat!' },
    { id: 2, text: 'Robot will move with music' },
    { id: 3, text: 'Watch the LED colors change' }
  ]
};

// Render content
const renderContent = () => {
  const html = data.items
    .map(item => `
      <div class="item" data-id="${item.id}">
        ${item.text}
      </div>
    `)
    .join('');
  
  content.innerHTML = html;
};

// Handle LED button clicks
ledButtons.forEach(button => {
  button.addEventListener('click', () => {
    const color = button.getAttribute('data-color');
    
    // Connect to robot if not already connected
    if (!robotApi.isConnected) {
      robotApi.connect();
    }
    
    robotApi.setColor(color);
  });
});

// Handle movement button clicks
moveButtons.forEach(button => {
  button.addEventListener('click', () => {
    let direction;
    
    // Connect to robot if not already connected
    if (!robotApi.isConnected) {
      robotApi.connect();
    }
    
    switch(button.id) {
      case 'moveForward':
        direction = 'forward';
        break;
      case 'moveBackward':
        direction = 'backward';
        break;
      case 'moveLeft':
        direction = 'left';
        break;
      case 'moveRight':
        direction = 'right';
        break;
      case 'moveStop':
        direction = 'stop';
        break;
    }
    
    if (direction) {
      robotApi.move(direction);
    }
  });
});

// Handle neck button clicks
neckButtons.forEach(button => {
  button.addEventListener('click', () => {
    let position;
    
    // Connect to robot if not already connected
    if (!robotApi.isConnected) {
      robotApi.connect();
    }
    
    switch(button.id) {
      case 'neckUp':
        position = 'up';
        break;
      case 'neckDown':
        position = 'down';
        break;
      case 'neckCenter':
        position = 'center';
        break;
    }
    
    if (position) {
      robotApi.setNeckPosition(position);
    }
  });
});

// Event listeners
playButton.addEventListener('click', togglePlay);

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderContent();
  
  // Try to connect to robot on page load
  robotApi.connect();
}); 