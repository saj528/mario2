// create a new scene
let gameScene = new Phaser.Scene('Game');

// some parameters for our scene
gameScene.init = function() {
  //player parameters
  this.playerSpeed = 150;
  this.jumpSpeed = -600;
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
    if(!this.anims.get('walking'))
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
    if(!this.anims.get('burning'))
    //fire aninmation
    this.anims.create({
      key: 'burning',
      frames:this.anims.generateFrameNames('fire',{
        frames:[0,1]
      }),
      frameRate: 4,
      repeat: -1
    })
    
  //add all level elements
  this.setupLevel();
  
  //initiate barrel spawner
  this.setSpawner();

  //platforms group
  this.physics.add.collider([this.player,this.goal,this.barrels],this.platforms);

  //checks overlap
  this.physics.add.overlap(this.player,[this.fires,this.goal,this.barrels], this.restartGame, null, this);
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
  //load json data
  this.levelData = this.cache.json.get('levelData')
  //world bounds
  this.physics.world.bounds.width = this.levelData.world.width;
  this.physics.world.bounds.height = this.levelData.world.height;
  //create all the platforms
  //staticgroups are better for performance than plain groups i.e. .group()
  this.platforms = this.physics.add.staticGroup();
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

  //create all the fire
  //must give basic physics group properties
  this.fires = this.physics.add.group({
    allowGravity: false,
    immovable: true,
  });
  for(let i = 0; i < this.levelData.fires.length; i++){
    let current = this.levelData.fires[i];
     
    let newObj = this.add.sprite(current.x, current.y,'fire').setOrigin(0,0)
    //let newObj = this.fires.create(current.x, current.y,'fire').setOrigin(0,0).setOffset()
    //enable physics for plain group i.e. .group()
    //this.physics.add.existing(newObj);
    //newObj.body.allowGravity = false;
    //newObj.body.immovable = true;

    //playing burning anim
    newObj.anims.play('burning');
    //add to the group
    this.fires.add(newObj)

    //for level creation
    newObj.setInteractive();
    this.input.setDraggable(newObj);
    //listen to level creation
    this.input.on('drag',function(pointer,gameObject,dragX,dragY){
      gameObject.x = dragX
      gameObject.y = dragY
    });
   };

    //player creation
    this.player = this.add.sprite(this.levelData.player.x,this.levelData.player.y,'player',3);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    //camera bounds
    this.cameras.main.setBounds(0,0,360,700);
    this.cameras.main.startFollow(this.player);
   
    //goal
    this.goal = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'goal')
    this.physics.add.existing(this.goal);


};

//restart game and you won
gameScene.restartGame = function(sourceSprite,targetSprite){
  //fade out camera
  this.cameras.main.fade(500)
  //when fadeout is complete restart the game
  this.cameras.main.on('camerafadeoutcomplete',function(camera,effect){
  //restart the scene
  this.scene.restart();
  },this);
};

//generation of barrels
gameScene.setSpawner = function(){
  // barrel group
  this.barrels = this.physics.add.group({
    bounceY: 0.1,
    bounceX: 1,
    collideWorldBounds:true
  });
  //spawn barrels
  let spawningEvent = this.time.addEvent({
    delay: this.levelData.spawner.interval,
    loop: true,
    callbackScope:this,
    callback: function(){
      //create a barrel
      let barrel = this.barrels.get(this.goal.x,this.goal.y,'barrel');

      //reactivate
      barrel.setActive(true);
      barrel.setVisible(true);
      barrel.body.enable = true;
      //set barrel properties
      barrel.setVelocityX(this.levelData.spawner.speed)
      //duration
      this.time.addEvent({
        delay:this.levelData.spawner.lifespan,
        repeat:0,
        callbackScope:this,
        callback:function(){
          this.barrels.killAndHide(barrel);
          barrel.body.enable = false;
        }
      })
    }
  });
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
