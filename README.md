# Robot Dance Party

A fun webpage that makes your Ohmni robot dance to music with beat visualization.

## Structure

  ```
  .
  ├── index.html      # Main HTML file
  ├── styles/         # CSS files
  │   └── main.css    # Main stylesheet
  ├── js/             # JavaScript files
  │   └── main.js     # Main JS functionality
  └── dancemonkey.mp3 # Music file
  ```

## Features

- Music playback with play/pause button
- Real-time beat detection and visualization
- Ohmni robot control integration
  - Dance movements synced to beats
  - Neck movements that follow the music
  - LED color cycling on each beat
- Modern CSS with CSS variables
- Responsive design

## Usage

1. Make sure your Ohmni robot is connected and accessible
2. Open `index.html` in your browser
3. Click "Let's Dance!" to start the party
4. Watch your robot dance to the music!

## Technical Details

- Uses Web Audio API for sound analysis
- Canvas for beat visualization
- Ohmni WebAPI for robot control 