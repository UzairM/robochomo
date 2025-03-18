# Robot Dance Party

A fun webpage that makes your Ohmni robot dance to music with beat visualization.

## Structure

  ```
  .
  ├── index.html      # Main HTML file
  ├── styles/         # CSS files
  │   └── main.css    # Main stylesheet
  ├── js/             # JavaScript files
  │   ├── main.js     # Main JS functionality
  │   └── Ohmni-standalone.js # Ohmni robot API
  └── dancemonkey.mp3 # Music file
  ```

## Features

- Music playback with play/pause button
- Real-time beat detection and visualization
- Manual robot control buttons:
  - LED color controls (Red, Green, Blue, Yellow, Purple, White)
  - Movement controls (Forward, Backward, Left, Right, Stop)
  - Neck position controls (Up, Center, Down)
- Automatic Ohmni robot control integration
  - Dance movements synced to beats
  - Neck movements that follow the music
  - LED color cycling on each beat
- Modern CSS with CSS variables
- Responsive design
- Local Ohmni robot API integration (no internet required)

## Usage

1. Make sure your Ohmni robot is connected and accessible
2. Open `index.html` in your browser
3. Click "Let's Dance!" to start the party and auto-mode
4. Use the control buttons to manually control specific robot actions:
   - Change LED colors by clicking color buttons
   - Move the robot with the directional controls
   - Position the robot's neck with the neck controls

## Technical Details

- Uses Web Audio API for sound analysis
- Canvas for beat visualization
- Local Ohmni WebAPI for robot control (no internet dependency) 