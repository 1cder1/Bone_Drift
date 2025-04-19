// Load Matter.js library components
// Load Matter.js library components
const { Engine, Render, Runner, World, Bodies, Body, Constraint, Events } = Matter;

// HighScore Class: Manages scoring and game-over logic
class HighScore {
  constructor(canvasId, runner) {
    // Initialize canvas and context for drawing scores
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext('2d');
    this.score = 0; // Current score tracker
    this.highScore = parseInt(localStorage.getItem('highScore')) || 0; // Persistent high score tracker
    this.interval = null; // Timer interval for score counting
    this.runner = runner; // Runner instance for controlling the game loop
    
  }

  // Starts the score counting mechanism
  startCounting() {
    this.interval = setInterval(() => {
      this.score += 1;

      // Update high score if current score exceeds it
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('highScore', this.highScore);
      }
    }, 1000);

    this.renderScores(); // Begin rendering scores on the canvas
  }

  // Continuously renders the scores on the canvas
  renderScores() {
    const renderLoop = () => {
      // Clear the area where scores are displayed
      this.context.clearRect(10, 10, 200, 50);

      // Render current score
      this.context.font = '20px Arial';
      this.context.fillStyle = 'black';
      this.context.fillText(`Score: ${this.score}`, 10, 60);

      // Render high score
      this.context.fillText(`High Score: ${this.highScore}`, 10, 30);

      requestAnimationFrame(renderLoop); // Update canvas dynamically
    };
    renderLoop();
  }

  // Resets the current score and triggers game-over behavior
  resetScore() {

    this.score = 0; // Reset score tracker
     // Trigger game-over logic
  }

  // Stops the score counter
  stopCounting() {
    clearInterval(this.interval); // Clear the interval timer
  }

  // Sets up collision detection logic using Matter.js events
  setupCollisionDetection() {
    Events.on(this.runner.engine, 'collisionStart', (event) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        // Check if one body is the balloon and the other is a block
        const isBalloon = bodyA === this.balloon || bodyB === this.balloon;
        const isBlock = bodyA.label === 'Block' || bodyB.label === 'Block';

        if (isBalloon && isBlock) {
          this.resetScore();
// Trigger game-over logic
        }
      });
    });
  }

  // Handles game-over behavior
  endGame() {
    // Stop the game engine
    if (this.runner) {
      Runner.stop(this.runner);
    }
  
    // Hide the game canvas
    document.getElementById('game').style.display = 'none';
  
    // Update the High Score Display
    const highScoreElement = document.getElementById('high-score-display');
    highScoreElement.textContent = `High Score: ${this.highScore}`; // Set the high score dynamically
  
    // Show the death screen
    document.getElementById('death-screen').style.display = 'flex';
  
    // Retry button logic
    const retryButton = document.getElementById('retry-button');
    retryButton.addEventListener('click', () => {
      // Hide the death screen
      document.getElementById('death-screen').style.display = 'none';
  
      // Show the title screen
      document.getElementById('title-screen').style.display = 'flex';
  
      // Reinitialize game (logic here if required)
    });
  }
}
// Balloon and Ragdoll Movement Class
class BalloonMovement {
  constructor(canvasId, width, height) {
    this.canvas = document.getElementById(canvasId);
    this.width = width;
    this.height = height;
    
    // Create Matter.js engine and world
      this.engine = Engine.create();
      this.world = this.engine.world;

    // Start the Matter.js engine and renderer
    this.createRenderer();
    
    // Set up controls for balloon movement
    this.setupControls();

    // Movement speed control
    this.movementSpeed = 0.2;
    this.movementIncrement = 4;
    this.isMovingLeft = false;
    this.isMovingRight = false;

    // Create balloon and ragdoll after background is set up
    this.createBalloon();
    this.ragdoll = this.createRagdoll();

    // Initialize the HighScore counter
    this.highScore = new HighScore(canvasId);


    // Start spawning random blocks

    // Add collision detection
    this.setupCollisionDetection();

    // Run the Matter.js engine
    Runner.run(Runner.create(), this.engine);

    // Ensure balloon's Y position remains fixed
    Events.on(this.engine, 'beforeUpdate', this.keepBalloonOnYAxis.bind(this));
    Events.on(this.engine, 'beforeUpdate', this.moveBalloon.bind(this));
  }

  createRenderer() {
    
    this.render = Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: {
        width: this.width,
        height: this.height,
        wireframes: false,
        background: 'url(clouds.png)', // Make sure to use a valid image
      },
    });
  
    Render.run(this.render);
    
    // Start the background animation
    this.loopBackground();
  }

  loopBackground() {
    let positionY = 0; // Current vertical position of the background
    
    const updateBackground = () => {
      const speed = 1; // Speed of downward movement (adjustable)
  
      // Decrease positionY to move the background down
      positionY += speed;
  
      // Reset positionY once the background moves completely out of view
      if (positionY >= this.height) {
        positionY = 0; // Reset position for seamless loop
      }
  
      // Update the canvas background directly via CSS
      this.canvas.style.backgroundPosition = `center ${positionY}px`;
  
      // Keep animating
      requestAnimationFrame(updateBackground);
    };
  
    // Begin the animation loop
    updateBackground();
  }

  createBalloon() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
  
    this.balloon = Bodies.circle(centerX, centerY, 30, {
      isStatic: true, // Prevent movement caused by external forces
      label: 'Balloon',
      density: 0.0010,
      collisionFilter: {
        group: -1,
      },
      render: {
        sprite: {
          texture: 'balloon.png', // Replace with the path to your image
          xScale: 0.8,
          yScale: 0.8,
        },
      },
    });
  
    World.add(this.world, this.balloon);
  }

  createRagdoll() {
    const x = this.width / 2;
    const y = this.height / 3 + 100;
  
    // Define body parts
    const head = Bodies.circle(x, y - 40, 12, {
      density: 0.0008,
      restitution: 0,
      frictionAir: 0.02,
      collisionFilter: { group: 0 },
      render: {
        sprite: {
          texture: 'head.png',
          xScale: 0.4,
          yScale: 0.4,
        },
      },
    });
  
    const torso = Bodies.rectangle(x, y, 15, 50, {
      frictionAir: 0.05,
      collisionFilter: { group: 0 },
      inertia: Infinity,
      render: {
        sprite: {
          texture: 'torse.png',
          xScale: 0.4,
          yScale: 0.4,
        },
      },
    });
  
    const rightArm = Bodies.rectangle(x + 12, y - 15, 40, 8, { // Adjusted closer to torso
      frictionAir: 0.05,
      collisionFilter: { group: -1 },
      render: {
        sprite: {

          texture: 'armR.png',
          xScale: 0.4,
          yScale: 0.4,
        },
      },
    });
  
    const leftArm = Bodies.rectangle(x - 12, y - 15, 40, 8, { // Adjusted closer to torso
      frictionAir: 0.05,
      collisionFilter: { group: -1 },
      render: {
        sprite: {
          texture: 'arm.png',
          xScale: 0.4,
          yScale: 0.4,
        },
      },
    });
  
    const rightLeg = Bodies.rectangle(x + 10, y + 60, 15, 50, {
      frictionAir: 0.05,
      collisionFilter: { group: -1 },
      render: {
        sprite: {
          texture: 'leg.png',
          xScale: 0.4,
          yScale: 0.4,
        },
      },
    });
  
    const leftLeg = Bodies.rectangle(x - 10, y + 60, 15, 50, {
      frictionAir: 0.05,
      collisionFilter: { group: -1 },
      render: {
        sprite: {
          texture: 'leg.png',
          xScale: 0.4,
          yScale: 0.4,
        },
      },
    });
  
    // Define constraints
    const constraints = [
      Constraint.create({
        bodyA: head,
        bodyB: torso,
        pointA: { x: 0, y: 18 },
        pointB: { x: 0, y: -20 },
        stiffness: 0.9, // Looser for natural fall
        damping: 0.3,
        render: { visible: false },
      }),
      Constraint.create({
        bodyA: torso,
        bodyB: rightArm,
        pointA: { x: 10, y: -20 }, // Adjusted closer to shoulder area
        pointB: { x: -15, y: 0 }, // Proper arm attachment
        stiffness: 0.5,
        damping: 0.4,
        render: { visible: false },
      }),
      Constraint.create({
        bodyA: torso,
        bodyB: leftArm,
        pointA: { x: -10, y: -20 }, // Adjusted closer to shoulder area
        pointB: { x: 15, y: 0 }, // Proper arm attachment
        stiffness: 1,
        damping: 0.4,
        render: { visible: false },
      }),
      Constraint.create({
        bodyA: torso,
        bodyB: rightLeg,
        pointA: { x: 5, y: 30 },
        pointB: { x: 0, y: -20 },
        stiffness: 0.8,
        damping: 0.4,
        render: { visible: false },
      }),
      Constraint.create({
        bodyA: torso,
        bodyB: leftLeg,
        pointA: { x: -5, y: 30 },
        pointB: { x: 0, y: -20 },
        stiffness: 0.8,
        damping: 0.4,
        render: { visible: false },
      }),
      Constraint.create({
        bodyA: rightArm,
        pointA: { x: 20, y: 0 },
        bodyB: this.balloon,
        pointB: { x: 0, y: 30 },
        stiffness: 1,
        damping: 0.3,
        render: { 
          visible: true,
          strokeStyle: 'brown',
          lineWidth: 5,
         },
      }),
    ];
  
    // Add parts to the world
    World.add(this.world, [...constraints, rightArm, rightLeg, leftLeg, torso, leftArm, head]);
  
    return [head, torso, rightArm, leftArm, rightLeg, leftLeg];
  }
  
  setupCollisionDetection() {
    let audioPlayed = false; // Flag to ensure audio plays only once
  
    Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        // Check if the collision is between the balloon and a block
        const isBalloon = bodyA === this.balloon || bodyB === this.balloon;
        const isBlock = bodyA.label === 'Block' || bodyB.label === 'Block';
  
        if (isBalloon && isBlock && !audioPlayed) {
          const meowAudio = new Audio('meow.mp3'); 
          const themeAudio = new Audio('BoneDriftSong.mp3');// Load the audio file
          meowAudio.play(); // Play the sound
          audioPlayed = true; // Set the flag to prevent further playback
          themeAudio.pause();
          themeAudio.loop = false;

          this.highScore.endGame(); // Trigger game over
        }
      });
    });
  }

  keepBalloonOnYAxis() {
    const centerY = this.height / 2;
    Body.setPosition(this.balloon, { x: this.balloon.position.x, y: centerY });
  }

  moveBalloon() {
    const balloonRadius = 30;
  
    if (this.isMovingLeft) {
      const newX = this.balloon.position.x - this.movementIncrement;
      if (newX - balloonRadius >= 0) {
        Body.setStatic(this.balloon, false); // Temporarily enable movement
        Body.setPosition(this.balloon, {
          x: newX,
          y: this.balloon.position.y,
        });
        Body.setAngle(this.balloon, -0.1); // Slight tilt to the left
        Body.setStatic(this.balloon, true); // Lock position after movement
      }
    }
    if (this.isMovingRight) {
      const newX = this.balloon.position.x + this.movementIncrement;
      if (newX + balloonRadius <= this.width) {
        Body.setStatic(this.balloon, false); // Temporarily enable movement
        Body.setPosition(this.balloon, {
          x: newX,
          y: this.balloon.position.y,
        });
        Body.setAngle(this.balloon, 0.1); // Slight tilt to the right
        Body.setStatic(this.balloon, true); // Lock position after movement
      }
    }
  
    // Reset tilt when no keys are pressed
    if (!this.isMovingLeft && !this.isMovingRight) {
      Body.setStatic(this.balloon, false); // Temporarily enable movement
      Body.setAngle(this.balloon, 0); // Reset tilt to neutral
      Body.setStatic(this.balloon, true); // Lock position after resetting tilt
    }
  }
  setupControls() {
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') this.isMovingLeft = true;
      if (key === 'd' || key === 'arrowright') this.isMovingRight = true;
    });

    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') this.isMovingLeft = false;
      if (key === 'd' || key === 'arrowright') this.isMovingRight = false;
    });
  }
  startSpawningBlocks() {

    let spawnRate = 1000; // Initial spawn rate in milliseconds
  
    // Function to spawn a new block
    const spawnBlock = () => {
      const x = Math.random() * this.width; // Random X position within canvas width
      const block = Bodies.rectangle(x, 0, 20, 20, {
        label: 'Block',
        render: {
          sprite: {
            texture: 'cat.png', // Path to your image
            xScale: 1, // Scale the image
            yScale: 1,
          },
        },
      });
      World.add(this.world, block); 
      
    };
  
    // Function to increase the spawn speed over time
    const increaseSpawnSpeed = () => {
      if (spawnRate > 200) { // Set a minimum spawn rate limit
        spawnRate -= 50; // Gradually increase block spawn speed
        clearInterval(spawnInterval); // Clear the existing interval
        spawnInterval = setInterval(spawnBlock, spawnRate); // Create a new interval with updated spawn rate
      }
    };
  
    // Event listener to rotate blocks and remove out-of-bounds blocks
    if (!this.beforeUpdateListenerAdded) {
      Events.on(this.engine, 'beforeUpdate', () => {
        this.world.bodies.forEach((body) => {
          if (body.label === 'Block') {
            // Apply rotation to blocks as they fall
            Body.rotate(body, -0.05); // Rotate counterclockwise (change to positive for clockwise)
  
            // Remove blocks that are out of bounds
            if (body.position.y > this.height) {
              World.remove(this.world, body);
            }
          }
        });
      });
      this.beforeUpdateListenerAdded = true; // Avoid re-adding the listener
    }
  
    // Start block spawning and speed increase intervals
    let spawnInterval = setInterval(spawnBlock, spawnRate); // Initial interval
    setInterval(increaseSpawnSpeed, 5000); // Gradually increase speed every 5 seconds
  }
}

// Initialize the BalloonMovement game
new BalloonMovement('game', 570, 790);


// Rainbow Colors for Animation
const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
const message = [
  "   ¸¸.•¨•♫♪•♫♫•¨•.¸",
  "     ░H░A░P░P░Y░",
  "   ░B░I░R░T░H░D░A░Y░",
  " ¸¸.•¨•░H░A░T░♪♫•¨•.¸¸♫♪"
];

// Cat with Blinking Animation (Centered)
let rainbowCatFrames = [
  "        /\\_/\\        \n       ( o.o )       \n        > ^ <        ",  // Eyes open
  "        /\\_/\\        \n       ( -.- )       \n        > ^ <        "   // Eyes closed
];

// Index for Animation
let colorIndex = 0;
let blinkIndex = 0;

function animateRainbow() {
  console.clear(); // Clear the console for smooth animation

  // Blinking Rainbow Cat (Centered)
  console.log(
    `%c${rainbowCatFrames[blinkIndex]}`,
    `color: ${rainbowColors[colorIndex % rainbowColors.length]}; font-size: 16px; font-weight: bold; font-family: "Courier New", monospace; text-align: center;`
  );

  // Animated Rainbow Text (Centered)
  message.forEach((line, index) => {
    const color = rainbowColors[(colorIndex + index) % rainbowColors.length];
    console.log(
      `%c${line}`,
      `color: ${color}; font-size: 16px; font-weight: bold; text-align: center;`
    );
  });

  // Cycle colors and blink animation
  colorIndex = (colorIndex + 1) % rainbowColors.length;
  blinkIndex = (blinkIndex + 1) % rainbowCatFrames.length;

  setTimeout(animateRainbow, 500); // Adjust delay for animation speed
}

// Start the Rainbow Animation
animateRainbow();