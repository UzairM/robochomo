// DOM Elements
const content = document.getElementById('content');
const audioPlayer = document.getElementById('audioPlayer');
const playButton = document.getElementById('playButton');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const cssVisualizer = document.getElementById('css-visualizer');

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
let useSimpleVisualizer = true; // Set to true by default for Ohmni WebView
let danceInterval = null; // Interval for robot dancing

// Always use CSS visualizer for Ohmni
document.querySelector('.visualizer-container').classList.add('show-css-visualizer');

// Movement constants
const MOVE_SPEED = 150;
const MOVE_TIME = 500;

// Neck position constants
const NECK_POSITIONS = {
  up: 200,     // More extreme up position (was 250)
  center: 450,  // Center position
  down: 650     // More extreme down position (was 600)
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
        console.log('Robot connected successfully. API available.');
        
        // Enable neck torque when connecting
        Ohmni.setNeckTorqueEnabled(1);
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
    
    console.log('Dancing with intensity:', intensity);
    
    const speed = Math.floor(intensity * 200);
    
    // Randomly choose between different dance moves
    const danceMove = Math.floor(Math.random() * 4);
    
    switch(danceMove) {
      case 0: // Spin left
        Ohmni.move(-speed, speed, 600);
        setTimeout(() => {
          Ohmni.move(speed, -speed, 600);
        }, 650);
        break;
      case 1: // Spin right
        Ohmni.move(speed, -speed, 600);
        setTimeout(() => {
          Ohmni.move(-speed, speed, 600);
        }, 650);
        break;
      case 2: // Forward-backward
        Ohmni.move(speed, speed, 600);
        setTimeout(() => {
          Ohmni.move(-speed, -speed, 600);
        }, 650);
        break;
      case 3: // Wiggle
        Ohmni.move(speed/2, -speed/2, 300);
        setTimeout(() => {
          Ohmni.move(-speed/2, speed/2, 300);
        }, 350);
        setTimeout(() => {
          Ohmni.move(speed/2, -speed/2, 300);
        }, 700);
        break;
    }
  },
  
  // Move robot's neck to beat
  shakeNeck: function(intensity) {
    if (!this.isConnected) return;
    
    console.log('Shaking neck with intensity:', intensity);
    
    // Current neck position plus random movement based on intensity
    const movement = Math.floor(intensity * 150);
    const currentPos = NECK_POSITIONS.center;
    Ohmni.setNeckPosition(currentPos + movement, 90);
    
    setTimeout(() => {
      Ohmni.setNeckPosition(currentPos - movement, 90);
    }, 300);
  },
  
  // Cycle LED colors
  cycleColor: function() {
    if (!this.isConnected) return;
    
    console.log('Cycling color to next');
    
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
    
    // Make sure neck torque is enabled
    Ohmni.setNeckTorqueEnabled(1);
    
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
    
    // Using values from sample.md: Ohmni.setNeckPosition(pos, ival)
    // where pos is position value and ival is speed (higher = faster)
    console.log('Setting neck position to:', pos);
    Ohmni.setNeckPosition(pos, 100);
  },
  
  // Reset robot position
  resetPosition: function() {
    if (!this.isConnected) return;
    
    Ohmni.setNeckTorqueEnabled(1);
    setTimeout(() => {
      Ohmni.setNeckPosition(NECK_POSITIONS.center, 100); // Center position
      Ohmni.setLightColor(0, 0, 100); // White light
    }, 500);
  }
};

// Initialize Audio Context with fallback for older browsers
function initAudio() {
  try {
    // Try modern Web Audio API
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    
    // Connect audio player to analyzer
    const source = audioContext.createMediaElementSource(audioPlayer);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Set up analyzer with smaller FFT size for better compatibility
    analyser.fftSize = 128; // Reduced from 256
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    console.log("Using modern Web Audio API");
  } catch (e) {
    console.warn("Web Audio API not fully supported, using simple visualizer", e);
    useSimpleVisualizer = true;
    
    // Set up simple beat detection via audio element
    setupSimpleAudioDetection();
  }
}

// Simple Audio Detection for older browsers
function setupSimpleAudioDetection() {
  // Clear canvas with background
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  console.log("Setting up simple audio detection");
  
  // Show CSS visualizer and hide canvas
  document.querySelector('.visualizer-container').classList.add('show-css-visualizer');
}

// Simple timer-based robot dance
function startRobotDance() {
  // Clear any existing interval
  if (danceInterval) {
    clearInterval(danceInterval);
  }
  
  console.log("Starting robot dance interval");
  
  // Start a new interval for robot dancing
  danceInterval = setInterval(() => {
    if (!isPlaying) return;
    
    // Generate random intensity between 0.5 and 1.0 for more pronounced movements
    const intensity = Math.random() * 0.5 + 0.5;
    
    console.log("Dance trigger - intensity:", intensity);
    
    // Trigger robot actions
    robotApi.dance(intensity);
    
    // Wait a bit then trigger neck movement
    setTimeout(() => {
      robotApi.shakeNeck(intensity);
    }, 700); // Increased delay to avoid overlapping with dance movement
    
  }, 2000); // Increased from 800ms to 2000ms to give more time for each movement

  // Separate interval for faster light changes
  setInterval(() => {
    if (!isPlaying) return;
    robotApi.cycleColor();
  }, 500); // Change lights every 500ms
}

// Simple visualizer for older browsers
function drawSimpleVisualizer() {
  // Clear canvas
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const barCount = 20; // Fewer bars for better performance
  const barWidth = canvas.width / barCount;
  
  // Draw simple bars with random heights
  for (let i = 0; i < barCount; i++) {
    const height = Math.random() * canvas.height * 0.8;
    
    // Color based on position
    const hue = (i / barCount) * 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    
    // Draw bar
    ctx.fillRect(
      i * barWidth, 
      canvas.height - height, 
      barWidth - 2, 
      height
    );
  }
}

// Modern visualizer using Web Audio API
function drawModernVisualizer() {
  if (!audioContext || useSimpleVisualizer) return;
  
  requestAnimationFrame(drawModernVisualizer);
  
  try {
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate average bass frequency (where beats usually are)
    let bassSum = 0;
    const bassRange = 4; // First few frequency bins for bass (reduced from 8)
    for (let i = 0; i < bassRange; i++) {
      bassSum += dataArray[i];
    }
    const bassAvg = bassSum / bassRange;
    
    // Beat detection
    const now = Date.now();
    if (bassAvg > 170 && now - lastBeatTime > beatThreshold) {
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
    
    // Draw a smaller number of bars for better performance
    const skipFactor = 2; // Only draw every nth bar
    const barWidth = (canvas.width / (bufferLength / skipFactor));
    let x = 0;
    
    for (let i = 0; i < bufferLength; i += skipFactor) {
      const barHeight = dataArray[i] / 255 * canvas.height;
      
      // Color based on frequency and beat detection
      const hue = i / bufferLength * 360;
      const saturation = beatDetected ? '100%' : '70%';
      const lightness = beatDetected ? '50%' : '40%';
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}, ${lightness})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      
      x += barWidth;
    }
  } catch (e) {
    console.error("Error in visualizer, switching to simple mode", e);
    useSimpleVisualizer = true;
    setupSimpleAudioDetection();
  }
}

// Choose appropriate visualizer and start it
function startVisualizer() {
  if (useSimpleVisualizer) {
    drawSimpleVisualizer();
  } else {
    drawModernVisualizer();
  }
}

// Start visualizer animation
function activateVisualizer() {
  // Always show the CSS visualizer for better compatibility
  document.querySelector('.visualizer-container').classList.add('show-css-visualizer');
  
  // Start robot dance sequence based on timer, not audio analysis
  startRobotDance();
}

// Play/Pause audio
function togglePlay() {
  try {
    if (!audioContext) {
      initAudio();
    }
    
    if (isPlaying) {
      // Pause
      audioPlayer.pause();
      playButton.textContent = 'Let\'s Dance!';
      isPlaying = false;
      
      // Stop the dance interval
      if (danceInterval) {
        clearInterval(danceInterval);
        danceInterval = null;
      }
    } else {
      // Play
      console.log("Attempting to play audio...");
      
      // Connect to robot if not already connected
      if (!robotApi.isConnected) {
        robotApi.connect();
      }
      
      // Activate visualizer and robot dance
      activateVisualizer();
      
      audioPlayer.play()
        .then(() => {
          console.log("Audio playing successfully");
          playButton.textContent = 'Pause';
          isPlaying = true;
        })
        .catch(err => {
          console.error("Error playing audio:", err);
          alert("Could not play audio. Please try again.");
        });
    }
  } catch (e) {
    console.error("Error toggling play:", e);
    alert("Error playing audio. Your browser may not support the required features.");
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
  
  // Set up canvas with basic size
  canvas.width = canvas.clientWidth || 300;
  canvas.height = canvas.clientHeight || 200;
  
  // Try to connect to robot on page load
  robotApi.connect();
  
  // Always use CSS visualizer for better compatibility
  document.querySelector('.visualizer-container').classList.add('show-css-visualizer');
  
  console.log("Page loaded and initialized");
}); 