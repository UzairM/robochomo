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
let colorInterval = null; // Separate interval for LED color changes

// Always use CSS visualizer for Ohmni
document.querySelector('.visualizer-container').classList.add('show-css-visualizer');

// Movement constants
const MOVE_SPEED = 180; // Increased to make movement more noticeable
const MOVE_TIME = 600;  // Longer movement time

// Neck position constants
const NECK_POSITIONS = {
  up: 250,     // Match from sample.md
  center: 450,  // Middle point
  down: 600     // Match from sample.md
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
  dancePattern: 0, // Track which dance pattern to use
  
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
    
    // Cycle through different dance patterns
    this.dancePattern = (this.dancePattern + 1) % 3;
    
    // Use different patterns to try to get the robot to turn
    switch(this.dancePattern) {
      case 0:
        this.dancePattern1(intensity);
        break;
      case 1:
        this.dancePattern2(intensity);
        break;
      case 2:
        this.dancePattern3(intensity);
        break;
    }
  },
  
  // Dance pattern 1: Basic turning attempt
  dancePattern1: function(intensity) {
    const speed = Math.floor(intensity * 300);
    console.log('Dance pattern 1 - left/right turns with speed:', speed);
    
    // First try to turn left
    Ohmni.move(-speed, speed, 800);
    
    // Then turn right
    setTimeout(() => {
      Ohmni.move(speed, -speed, 800);
      
      // Then stop
      setTimeout(() => {
        Ohmni.move(0, 0, 100);
      }, 850);
    }, 850);
  },
  
  // Dance pattern 2: Forward/backward with higher speed
  dancePattern2: function(intensity) {
    const speed = Math.floor(intensity * 250);
    console.log('Dance pattern 2 - forward/backward with speed:', speed);
    
    // Forward
    Ohmni.move(speed, speed, 500);
    
    // Then backward
    setTimeout(() => {
      Ohmni.move(-speed, -speed, 500);
      
      // Then stop
      setTimeout(() => {
        Ohmni.move(0, 0, 100);
      }, 550);
    }, 550);
  },
  
  // Dance pattern 3: Zigzag movement
  dancePattern3: function(intensity) {
    const speed = Math.floor(intensity * 220);
    console.log('Dance pattern 3 - zigzag with speed:', speed);
    
    // Forward right
    Ohmni.move(speed, speed/2, 400);
    
    setTimeout(() => {
      // Forward left
      Ohmni.move(speed/2, speed, 400);
      
      setTimeout(() => {
        // Backward
        Ohmni.move(-speed, -speed, 400);
        
        // Then stop
        setTimeout(() => {
          Ohmni.move(0, 0, 100);
        }, 450);
      }, 450);
    }, 450);
  },
  
  // Move robot's neck to beat - redesigned based on sample.md
  shakeNeck: function(intensity) {
    if (!this.isConnected) return;
    
    console.log('Shaking neck with intensity:', intensity);
    
    // Make sure torque is enabled first
    Ohmni.setNeckTorqueEnabled(1);
    
    // Use the phase approach from sample.md
    const neckSequence = async () => {
      try {
        // Move to up position first (use sample.md's values)
        Ohmni.setNeckPosition(NECK_POSITIONS.up, 100);
        
        // Wait for movement to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Then move to down position
        Ohmni.setNeckPosition(NECK_POSITIONS.down, 100);
        
        // Wait for movement to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Back to center
        Ohmni.setNeckPosition(NECK_POSITIONS.center, 100);
      } catch (error) {
        console.error("Error during neck movement:", error);
      }
    };
    
    // Execute the sequence
    neckSequence();
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
  },
  
  // Implement the nodding functionality from sample.md
  nod: function() {
    if (!this.isConnected) return;
    
    console.log('Nodding neck (sample.md method)');
    
    // Create phases array like in sample.md
    const phases = [
      (cb) => {
        // Enable torque
        Ohmni.setNeckTorqueEnabled(1);
        setTimeout(cb, 500);
      },
      (cb) => {
        // Move to down position
        Ohmni.setNeckPosition(NECK_POSITIONS.down, 100);
        setTimeout(cb, 1500);
      },
      (cb) => {
        // Move to up position
        Ohmni.setNeckPosition(NECK_POSITIONS.up, 100);
        setTimeout(cb, 1500);
      },
      (cb) => {
        // Back to center
        Ohmni.setNeckPosition(NECK_POSITIONS.center, 100);
        setTimeout(cb, 500);
      }
    ];
    
    // Run phases in sequence
    this.runPhases(phases, 0);
  },
  
  // Helper function to run phases in sequence (from sample.md)
  runPhases: function(phases, index) {
    // Check if we have something to do
    if (index >= phases.length) return;
    
    // Get and run the function with a callback to trigger next phase
    const fn = phases[index];
    fn(() => {
      setTimeout(() => {
        this.runPhases(phases, index + 1);
      }, 1);
    });
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

// Start fast color cycling
function startColorCycling(speed = 500) {
  // Clear any existing color interval
  if (colorInterval) {
    clearInterval(colorInterval);
  }
  
  console.log(`Starting color cycling with interval ${speed}ms`);
  
  // Create a new interval that cycles colors quickly
  colorInterval = setInterval(() => {
    if (!isPlaying) return;
    robotApi.cycleColor();
  }, speed); // Change colors every X milliseconds (faster than dance moves)
}

// Stop color cycling
function stopColorCycling() {
  if (colorInterval) {
    clearInterval(colorInterval);
    colorInterval = null;
  }
}

// Simple timer-based robot dance
function startRobotDance() {
  // Clear any existing interval
  if (danceInterval) {
    clearInterval(danceInterval);
  }
  
  console.log("Starting robot dance interval");
  
  // Start fast color cycling
  startColorCycling(150); // LED changes every 150ms (much faster)
  
  // Start a new interval for robot dancing
  danceInterval = setInterval(() => {
    if (!isPlaying) return;
    
    // Generate random intensity between 0.7 and 1.0 for even more pronounced movements
    const intensity = Math.random() * 0.3 + 0.7;
    
    console.log("Dance trigger - intensity:", intensity);
    
    // Trigger robot actions
    robotApi.dance(intensity);
    
    // Wait a bit then trigger neck movement
    setTimeout(() => {
      // Use the sample.md-based implementation
      robotApi.nod();
    }, 1800); // Increased delay to avoid overlapping with more complex dance moves
    
    // Color is handled by separate interval now
    
  }, 5000); // Increased to give more time for the full nodding sequence
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
      
      // Stop color cycling
      stopColorCycling();
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

// Add event listener for the rotation test button
const rotateTestButton = document.getElementById('rotateTestButton');
rotateTestButton.addEventListener('click', testRotation);

// Add event listener for the nod test button
const nodButton = document.getElementById('nodButton');
nodButton.addEventListener('click', () => {
  if (!robotApi.isConnected) {
    robotApi.connect();
  }
  robotApi.nod();
});

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

// Direct rotation test - try multiple approaches
function testRotation() {
  if (!robotApi.isConnected) {
    robotApi.connect();
  }
  
  console.log("Starting rotation test sequence");
  
  // Test rotation approach 1: Direct left/right wheel speed difference
  const rotationTest = async () => {
    try {
      // Method 1: Strong left rotation
      console.log("Test 1: Strong left rotation");
      Ohmni.setLightColor(0, 100, 100); // Red during left turn
      Ohmni.move(-400, 400, 1500);
      
      // Pause
      await new Promise(resolve => setTimeout(resolve, 1600));
      
      // Method 2: Strong right rotation
      console.log("Test 2: Strong right rotation");
      Ohmni.setLightColor(240, 100, 100); // Blue during right turn
      Ohmni.move(400, -400, 1500);
      
      // Pause
      await new Promise(resolve => setTimeout(resolve, 1600));
      
      // Method 3: Try rotation with uneven but same-sign speeds
      console.log("Test 3: Uneven wheels rotation");
      Ohmni.setLightColor(120, 100, 100); // Green
      Ohmni.move(400, 100, 1500); // Right wheel faster than left
      
      // Pause
      await new Promise(resolve => setTimeout(resolve, 1600));
      
      // Method 4: Small circles
      console.log("Test 4: Small circles");
      Ohmni.setLightColor(60, 100, 100); // Yellow
      Ohmni.move(300, -100, 2000); // One forward, one backward but different magnitudes
      
      // End with stopping
      await new Promise(resolve => setTimeout(resolve, 2100));
      Ohmni.move(0, 0, 100);
      Ohmni.setLightColor(0, 0, 100); // White at end
      
      console.log("Rotation test sequence completed");
    } catch (error) {
      console.error("Error during rotation test:", error);
    }
  };
  
  rotationTest();
} 