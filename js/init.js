// ############################################################################
// #### INIT.JS - Initialization file #########################################
// ############################################################################

// Output usefull messages when debuging
var DEBUG = false;
var SHOW_BOUNDINGBOX = false;
var SHOW_CROSSHAIR = true;
var IS_RUNNING = false;
var EDITOR_MODE = false;

// Canvas, gl & programs
var canvas,gl,shaderProgram,wireframeProgram;
var models = [];
var ammoClip = [];
var enemyList = [];

var castleHealth = 100;

// Determine if all models are loaded
var allModelsLoaded = false;

// Animation required variables
var lastTime = 0;
var ticks = 0;

function updateCastleHealth() {
    if (castleHealth <= 0) {
        gameOver();
        return;
    }

    var bar = document.querySelector('.healthbar');

    var bars = bar.querySelectorAll('span');
    for (var i = 0; i < bars.length; i++) bar.removeChild(bars[i]);

    var remain = castleHealth / 10 + 1;
    for (var i = 0; i < 10; i++) {
    var child = document.createElement('span');

    if (i < (10 - remain)) child.classList.add('no');
        bar.appendChild(child);
    }
}

function initGL(canvas) {
  if (DEBUG) console.info('Initializing Graphics Library (WebGL)');
  var gl = null;
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch(e) {}

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
}

function initShaders() {
  if (DEBUG) console.info('Initializing Shaders');
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  // start using shading program for rendering
  gl.useProgram(shaderProgram);

  // Get attributes
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  // Store locations of matrix uniforms
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

  shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
  shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
  shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
}

function wireframeShadersInit() {
  var fragmentShader = getShader(gl, "wireframe-shader-fs");
  var vertexShader = getShader(gl, "wireframe-shader-vs");

  wireframeProgram = gl.createProgram();
  gl.attachShader(wireframeProgram, vertexShader);
  gl.attachShader(wireframeProgram, fragmentShader);
  gl.linkProgram(wireframeProgram);

  if (!gl.getProgramParameter(wireframeProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  gl.useProgram(wireframeProgram);

  wireframeProgram.vertexPositionAttribute = gl.getAttribLocation(wireframeProgram, "aVertexPosition");
  gl.enableVertexAttribArray(wireframeProgram.vertexPositionAttribute);

  wireframeProgram.pMatrixUniform = gl.getUniformLocation(wireframeProgram, "uPMatrix");
  wireframeProgram.mvMatrixUniform = gl.getUniformLocation(wireframeProgram, "uMVMatrix");
  wireframeProgram.vMatrixUniform = gl.getUniformLocation(wireframeProgram, "uVMatrix");
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!SHOW_CROSSHAIR) document.getElementById('crosshair').style.display = 'none';
    else document.getElementById('crosshair').style.display = 'block';

    if (window.allModelsLoaded) {
      rootNode.updateWorldMatrix();

      for (var i in models) {
          models[i].draw();
      }
    }
}

var elapsed = 0;
function animate() {
    if (!window.allModelsLoaded) return;

    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        elapsed = timeNow - lastTime;
        ticks++;
        execute_animation(elapsed,ticks);
    }
    lastTime = timeNow;
}

function start() {
    var ratio = 1920.0/1080.0;
    var canvas = document.getElementById('canvas');

    if(screen.width > 1600){
        ratio = 1600 / screen.width;   // get ratio for scaling image

        var w = width = 1600;
        var h = screen.height * ratio;

        h = h * ratio;    // Reset height to match scaled image
        w = w * ratio;    // Reset width to match scaled image

        canvas.height = h;
        canvas.width = w;
    }

    gl = initGL(canvas);

    fpsCamera = new Camera();
    initShaders();
    wireframeShadersInit();

    // Bind keyboard handling functions to document handlers
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    // Firefox
    document.addEventListener('DOMMouseScroll', wheel, false);
    // IE9, Chrome, Safari, Opera
    document.addEventListener('mousewheel', wheel, false);

    document.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    document.addEventListener('pointerlockchange', lockChange, false);
    document.addEventListener('mozpointerlockchange', lockChange, false);

    rootNode = new Model('',fpsCamera);
    window.models.push(rootNode);

    var characters = 'models/characters/';
    var landscape = 'models/landscape/';
    var buildings = 'models/buildings/';
    var armory = 'models/armory/';
    var misc = 'models/misc/';


    // Characters
    main_player = new Player();
    knight = new Model(characters + 'knight/knight.obj',main_player.player_camera);
    knight.loadModel();
    window.models.push(knight);

    skeleton = new Model(characters + 'skeleton/skeleton_archer.obj',main_player.player_camera);
    skeleton.loadModel();
    skeleton.alias = 'skeleton';

    demon = new Model(characters + 'demon/demon.obj',main_player.player_camera);
    demon.loadModel();
    demon.alias = 'demon';

    goul = new Model(characters + 'goul/micro_ghoul.obj',main_player.player_camera);
    goul.loadModel();
    goul.alias = 'goul';

    // Mouse Picker
    mouse_picker = Picker(main_player);

    // Misc
    flag_pole_short = new Model(misc + 'flag-pole-short/flag-pole-short.obj',main_player.player_camera);
    flag_pole_short.loadModel();
    window.models.push(flag_pole_short);

    flag = new Model(misc + 'flag/flag.obj',main_player.player_camera);
    flag.loadModel();
    window.models.push(flag);

    flag.setParent(flag_pole_short);

    // Landscape
    ground = new Model(landscape + 'ground/ground.obj',main_player.player_camera);
    ground.loadModel();
    window.models.push(ground);

    mountain_1 = new Model(landscape + 'mountain_1/mountain_1.obj',main_player.player_camera);
    mountain_1.loadModel();

    spruce_1 = new Model(landscape + 'spruce_1/spruce.obj',main_player.player_camera);
    spruce_1.loadModel();

    // Buildings - Castle
    castle = new Model(buildings + 'castle/castle.obj',main_player.player_camera);
    castle.loadModel();
    castle.alias = 'castle';
    window.models.push(castle);

    castle_fence_long = new Model(buildings + 'castle/fence_long/fence_big.obj',main_player.player_camera);
    castle_fence_long.loadModel();
    castle_fence_long.setParent(castle);
    window.models.push(castle_fence_long);

    castle_fence_short = new Model(buildings + 'castle/fence_short/fence_small.obj',main_player.player_camera);
    castle_fence_short.loadModel();
    castle_fence_short.setParent(castle);
    window.models.push(castle_fence_short);

    // Armory
    crossbow = new Model(armory + 'crossbow/crossbow.obj',main_player.player_camera);
    crossbow.loadModel();
    crossbow.setParent(knight);
    crossbow.collisionCheck = false;
    crossbow.rotateY(-0.5);
    window.models.push(crossbow);

    arrow = new Model(armory + 'arrow/arrow.obj',main_player.player_camera);
    arrow.loadModel();
    arrow.setParent(crossbow);
    arrow.collisionCheck = false;

    loadAllModels(initializeTransformations);

    gl.clearColor(236/255, 250/255, 254/255, 1.0);          // Set clear color to sky color
    gl.clearDepth(1.0);                                     // Clear everything
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things

    update();

    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    document.exitPointerLock();
}

function update() {
    animate();
    handleKeys();
    updateCastleHealth();
    drawScene();

    if (IS_RUNNING && window.allModelsLoaded) updateGameLogic();

    requestAnimationFrame(update);
}

function areModelsLoaded() {
  for (var i in models) {
      if (!models[i].modelLoaded) return false;
  }
  return true;
}

function loadAllModels(callback) {
  if (window.allModelsLoaded) return;

  var i = setInterval(waitModelsToLoad,100);

  function waitModelsToLoad() {
    if (areModelsLoaded()) {
        window.allModelsLoaded = true;
        clearInterval(i);
        console.info('All models are loaded & ready to rock');
        callback();
    }
  }
}

function fitCanvas() {
  var ratio = 1920.0/1080.0;
  var canvas = document.getElementById('canvas');

  var w = window.innerWidth;
  var h = window.innerHeight;
}
