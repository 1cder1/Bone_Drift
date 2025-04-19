document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const startButton = document.getElementById('start-button');
  const gameTitleImage = document.getElementById('game-title-image');
  const messageImage = document.getElementById('game-message-image');
  
  const audio = document.getElementById('myAudio');
  const deathScreen = document.getElementById('death-screen');
  const retryButton = document.getElementById('retry-button');
  const themeSong = document.getElementById('themeAudio');
  // Declare game-related variables
  let gameInstance = null;
  let highScoreInstance = null;

  // Autoplay music on the title screen
  audio.loop = true;
  audio.play();


  // Start button logic: Initializes the game
  if (startButton) {
    startButton.addEventListener('click', () => {
      // Hide title screen elements
      startButton.style.display = 'none';
      gameTitleImage.style.display = 'none';
      messageImage.style.display = 'none';
      // Pause title music
      audio.pause();
      audio.loop = false;
      themeAudio.play();
      themeAudio.loop = true;
      // Initialize game mechanics
      gameInstance = new BalloonMovement('game', 570, 790);
      highScoreInstance = new HighScore('game', gameInstance.runner);

      gameInstance.startSpawningBlocks(); // Start spawning blocks
      highScoreInstance.startCounting(); // Begin score counting
    });
  }

  // Retry button logic: Resets the game and score
  retryButton.addEventListener('click', () => {
    // Hide the death screen
    deathScreen.style.display = 'none';

    // Reset the current score but retain the high score
    if (highScoreInstance) {
      highScoreInstance.resetScore(); // Reset only the current score
    }

    // Reinitialize game mechanics
    gameInstance = new BalloonMovement('game', 570, 790);
    gameInstance.startSpawningBlocks(); // Restart spawning blocks
    highScoreInstance.startCounting(); // Restart score counting
  });

  // Extra retry logic: Optional page reload for clean restart
  document.getElementById('retry-button').addEventListener('click', () => {
    // Reload the page
    document.getElementById('death-screen').style.display = 'none';
    window.location.reload();
  });
});