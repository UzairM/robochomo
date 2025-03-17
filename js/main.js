// DOM Elements
const content = document.getElementById('content');
const audioPlayer = document.getElementById('audioPlayer');
const playButton = document.getElementById('playButton');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// Audio Context and Analyzer setup
let audioContext, analyser, dataArray, bufferLength;
let isPlaying = false;
let lastBeatTime = 0;
let beatThreshold = 200; // ms between beats
let beatDetected = false;

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
  
  // Reset robot position
  resetPosition: function() {
    if (!this.isConnected) return;
    
    Ohmni.setNeckPosition(50, 10); // Center position
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
}); 