// create a new scene
let gameScene = new Phaser.Scene('Game');

// some parameters for our scene
gameScene.init = function() {
  //player parameters
  this.playerSpeed = 150;
  this.jumpSpeed = -600;
  this.levelData = {
    platforms:[
           {
              "x": 72,
              "y": 450,
              "numTiles": 6,
              "key": "block"
           },
           {
              "x": 0,
              "y": 330,
              "numTiles": 8,
              "key": "block"
           },
           {
              "x": 72,
              "y": 210,
              "numTiles": 8,
              "key": "block"
           },
           {
              "x": 0,
              "y": 90,
              "numTiles": 7,
              "key": "block"
           },
           {
              "x": 0,
              "y": 560,
              "numTiles": 1,
              "key": "ground"
           }
    ]
  };
};

// load asset files for our game
gameScene.preload = function() {

  // load images
  this.load.image('ground', 'assets/images/ground.png');
  this.load.image('platform', 'assets/images/platform.png');
  this.load.image('block', 'assets/images/block.png');
  this.load.image('goal', 'assets/images/gorilla3.png');
  this.load.image('barrel', 'assets/images/barrel.png');

  // load spritesheets
  this.load.spritesheet('player', 'assets/images/player_spritesheet.png', {
    frameWidth: 28,
    frameHeight: 30,
    margin: 1,
    spacing: 1
  });

  this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', {
    frameWidth: 20,
    frameHeight: 21,
    margin: 1,
    spacing: 1
  });

  this.load.json('levelData', 'assets/json/levelData.json');
};

// executed once, after assets were loaded
gameScene.create = function() {
  //world bounds
  this.physics.world.bounds.width = 360;
  this.physics.world.bounds.height = 700;
  //platforms group
  
  //add all level elements
  this.setupLevel();
  //1) adding existing sprites to the physics system
  //sprite creation
  //let ground = this.add.sprite(180,604,'ground');
  //add sprite to the physics system - second parameter determines whether object will be static or not
  //this.physics.add.existing(ground,true);
  //adding ground to platforms group
  //this.platforms.add(ground);

  //repeats tiles, must give height and width to determine how many times block is repeated
  //let platform = this.add.tileSprite(180, 500,3 * 36, 1 * 30, 'block');
  //this.physics.add.existing(platform,true);
  //this.platforms.add(platform)
  //player animation walking
  this.anims.create({
    key: 'walking',
    frames:this.anims.generateFrameNames('player',{
      frames:[0,1,2]
    }),
    yoyo: true,
    frameRate: 12,
    repeat: -1
  })

  //player
  this.player = this.add.sprite(180,400,'player',3);
  this.physics.add.existing(this.player);
  this.physics.add.collider(this.player,this.platforms);
  this.player.body.setCollideWorldBounds(true);
  //disabling gravity - different from static
  //ground.body.allowGravity = false;

  //makes object unmovable
  //ground.body.immovable = true;

  //enable cursor keys
  this.cursors = this.input.keyboard.createCursorKeys();
  
  //2) creating and adding sprites to the physics system on same line
  //let ground2 = this.physics.add.sprite(180,200,'ground');

  //collision detection
  //this.physics.add.collider(ground,ground2);

  this.input.on('pointerdown',function(pointer){
    console.log(pointer.x,pointer.y)
  });
};

//excuted on ever frame
gameScene.update = function(){

  //are we on the ground?
  let onGround = this.player.body.blocked.down || this.player.body.touching.down;

  if(this.cursors.left.isDown){
    this.player.body.setVelocityX(-this.playerSpeed);
    this.player.flipX = false;
    //check
    if (!this.player.anims.isPlaying && onGround)
      this.player.anims.play('walking');
  }
  else if(this.cursors.right.isDown){
    this.player.body.setVelocityX(this.playerSpeed);
    this.player.flipX = true;
    if (!this.player.anims.isPlaying && onGround)
      this.player.anims.play('walking');
  }
  else{
    //make player stop
    this.player.body.setVelocityX(0);
    //make walking animation stop
    this.player.anims.stop('walking');
    //set default frame if on ground
    if(onGround)
      this.player.setFrame(3);
  }

  //handle jumping
  if(onGround && (this.cursors.space.isDown || this.cursors.up.isDown)){
    //give player y velocity
    this.player.body.setVelocityY(this.jumpSpeed);
    //stop walking animation
    this.player.anims.stop('walking');
    //change the frame
    this.player.setFrame(2);
  }
};

gameScene.setupLevel = function(){
  this.platforms = this.add.group();

  //load json data
  this.levelData = this.cache.json.get('levelData')
  //create all the platforms
  for(let i = 0; i < this.levelData.platforms.length; i++){
    let current = this.levelData.platforms[i];
    
    let newObj;

    //create object
    if(current.numTiles == 1){
      //create sprite
      newObj = this.add.sprite(current.x, current.y,current.key).setOrigin(0,0)
    }
    else{
      //create tile sprite
      let width = this.textures.get(current.key).get(0).width;
      let height = this.textures.get(current.key).get(0).height;
      newObj = this.add.tileSprite(current.x, current.y,current.numTiles*width,height,current.key).setOrigin(0,0)
    }
    //enable physics
    this.physics.add.existing(newObj,true);
    //add to the group
    this.platforms.add(newObj)
  }
};

// our game's configuration
let config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  scene: gameScene,
  title: 'Monster Kong',
  pixelArt: false,
  physics:{
    default:'arcade',
    arcade:{
      gravity: {y:1000},
      debug: true
    }
  }
};

// create the game, and pass it the configuration
let game = new Phaser.Game(config);
