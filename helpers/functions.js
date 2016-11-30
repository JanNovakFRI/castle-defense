var Vec3 = function(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function radToDeg(radians) {
    return radians * (180/Math.PI);
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function getShader(gl, id) {
  if (DEBUG) console.info('Creating Shader');
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.
  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
        shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function convertToUnindexedBuffer(indices, data, itemSize) {
    var out = [];

    for (var i = 0; i < indices.length; i++)
    {
        var index = indices[i];

        if (itemSize == 3) {
            out.push(data[itemSize * index]);
            out.push(data[itemSize * index + 1]);
            out.push(data[itemSize * index + 2]);
        }
        if (itemSize == 2) {
            out.push(data[itemSize * index]);
            out.push(data[itemSize * index + 1]);
        }
    }
    return out;
}

function getBasePath(path) {
    var base = path.split('/');
    if (base.length > 1) {
        return base.slice(0,-1).join('/') + "/";
    }
    return '';
}

function createTexture(image) {
    this.texture = gl.createTexture();
    this.texture.image = image;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return this.texture;
}

function restartGame()
{
    document.querySelector('.gameover').style.display = 'none';
    castleHealth = 100;
    IS_RUNNING = true;
    var canvas = document.getElementById('canvas');
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();

    clearEnemies();
    clearArrows();
    ammoClip = [];
    enemyList = [];
    round = 1;
    enemiesKilled = 0;
    enemyKillWeight = 0;
    timer = 0;
    spawnNewEnemies(round);
}

function gameOver() {
    IS_RUNNING = false;
    document.querySelector('.gameover').style.display = 'block';
    var canvas = document.getElementById('canvas');
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    document.exitPointerLock();

    var score = enemiesKilled * enemyKillWeight + round * 100 + survived;
    document.getElementById('score_val').innerHTML = score;

}

function startGame() {
    IS_RUNNING = true;
    castleHealth = 100;
    document.querySelector('.startgame').style.display = 'none';
    var canvas = document.getElementById('canvas');
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();

    clearEnemies();
    clearArrows();
    ammoClip = [];
    enemyList = [];
    round = 1;
    enemiesKilled = 0;
    enemyKillWeight = 0;
    timer = 0;
    spawnNewEnemies(round);
}

function clearEnemies() {
    for (var j = 0; j < enemyList.length; j++) {
        enemyList[j].destroy();
    }
}

function clearArrows() {
    for (var j = 0; j < ammoClip.length; j++) {
        ammoClip[j].destroy();
    }
}
