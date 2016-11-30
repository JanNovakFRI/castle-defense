// ################################################################################
// #### MAIN.JS - Main Game Logic #################################################
// ################################################################################

// ==== CAMERAS ====
var main_player;

// Keyboard handling helper variable for reading the status of keys
var currentlyPressedKeys = {};

// Mouse helper variables
var mouseDown_left = false;
var mouseDown_mid = false;
var lastMouseXDown = null;
var lastMouseYDown = null;

var mouse_picker;

// ==== MODELS ====
// !!! It is mandatory to use instances even for first model !!!

// Root Node
var rootNode;

// Landscape
var mountain_1,ground,example_spruce;

// Trees
var spruce_1;

// Characters
var knight, skeleton, demon, goul;

// Armory
var crossbow, arrow;

// Buildings
// Castle Parts
var castle,castle_fence_short,castle_fence_long;

// Misc
var flag_pole_short, flag;

// Instances
var mirror_pole,flag_mirror, mountain_1_1;



// ==== LOGIC ====
/* Function is called after all models are loaded
   Place for creating instances or init transformations */
function initializeTransformations() {
  // Set main player model
  main_player.setModel(0, 1.5, 0, 0, 100, 0, knight);

  rootNode.translate(0,0,-20);

  // Characters
  knight.translate(0,6.73392,0);
  castle.rotateY(-90);

  // Buildings - Castle
  castle_fence_short.translate(-0.12,6.93392,-5.60642);
  castle_fence_long.translate(5.38908,6.94371,-0.16);

  flag_pole_short.translate(5.38908,6,6);
  flag_pole_short.rotateX(20);
  flag.translate(0,0.3,0);

  mirror_pole = flag_pole_short.getInstance();
  mirror_pole.translate(-5.38908,6,6);
  mirror_pole.rotateX(20);
  window.models.push(mirror_pole);

  flag_mirror = flag.getInstance();
  flag_mirror.translate(0,0.3,0);
  flag_mirror.setParent(mirror_pole);
  window.models.push(flag_mirror);

  var fence_short_mirror = castle_fence_short.getInstance();
  fence_short_mirror.translate(-0.12,6.93392,5.30642);
  fence_short_mirror.setParent(castle);
  window.models.push(fence_short_mirror);

  var fence_long_mirror = castle_fence_long.getInstance();
  fence_long_mirror.translate(-5.52,6.94371,-0.16);
  fence_long_mirror.setParent(castle);
  window.models.push(fence_long_mirror);

  // Landscape
  example_spruce = spruce_1.getInstance();
  window.models.push(example_spruce);
  example_spruce.translate(-12,0,10);

  // Armory
  crossbow.translate(0.4,1.25,0.7);

  /*skeleton_1 = skeleton.getInstance();
  window.models.push(skeleton_1);
  skeleton_1.translate(-35.52562468442155,0,28.571466924685218);
  skeleton_1.rotateY(120);*/


  loadStaticScene(scene);
}

var skeleton_1;

function loadStaticScene(json) {

    for (var i = 0; i < json.models.length; i++) {
        var m = json.models[i];
        var model = window[m.model].getInstance();
        if (m['translate']) model.translate(m.translate[0],m.translate[1],m.translate[2]);
        if (m['scale']) model.scale(m.scale[0],m.scale[1],m.scale[2]);
        if (m['rotate']) {
            model.rotateX(m.rotate[0]);
            model.rotateY(m.rotate[1]);
            model.rotateZ(m.rotate[2]);
        }

        window.models.push(model);
    }
}



// ==== ANIMATIONS ====
// Called after every frame update when all models are loaded
var arrow_tmp;
var round = 1;
var timer = 0;
function execute_animation(elapsed, ticks) {
  main_player.transform(elapsed);

  flag.rotateY(5 * Math.sin(ticks * 0.8 * Math.PI / 75));
  flag_mirror.rotateY(10 * Math.sin(ticks * 0.8 * Math.PI / 75));

  // Animate arrows
  for (var i = 0; i < ammoClip.length; i++) {
      arrow_tmp = ammoClip[i];

      arrow_tmp.rotateZ(arrow_tmp.rz + 10*elapsed/10);
      arrow_tmp.translate(arrow_tmp.dx,arrow_tmp.dy,arrow_tmp.dz+0.45*elapsed/10);

      if (arrow_tmp.dz > 500) arrow_tmp.ref.destroy();
  }

  if (IS_RUNNING) {
      timer += elapsed;
      survived += elapsed;
      if (timer >= 10000) {
          timer = 0;
          round++;

          castleHealth += (round * 2.5);
          castleHealth = castleHealth > 100 ? 100 : castleHealth;
          spawnNewEnemies(round);
      }
  }

}

// ==== GAME LOGIC ====
var survived = 0;
function updateGameLogic() {

    // If enemy is hit lower his life
    for (var i = 0; i < ammoClip.length; i++) {

        for (var j = 0; j < enemyList.length; j++) {

            if (!ammoClip[i].destroyed && !enemyList[j].destroyed && !enemyList[j].killed && !ammoClip[i].ref.used) {
                if (enemyList[j].boundingBox.isIntersect(ammoClip[i].boundingBox) ) {
                    enemyList[j].health -= ammoClip[i].ref.damage;

                    ammoClip[i].ref.used = true;
                    if (enemyList[j].health <= 0) enemyList[j].killed = true;
                }
            }
        }
    }

    for (var j = 0; j < enemyList.length; j++) {
        if (enemyList[j].killed) enemyList[j].destroy();
    }

    for (var i = 0; i < ammoClip.length; i++) {
        if (ammoClip[i].ref.used) ammoClip[i].ref.destroy();
    }

    // If enemy hits the castle lower castle life
    for (var i = 0; i < window.models.length; i++) {

        for (var j = 0; j < enemyList.length; j++) {
            if (!enemyList[j].killed && !enemyList[j].destroyed && enemyList[j].boundingBox.isIntersect(castle.boundingBox)) {

                if (enemyList[j].alias == 'skeleton') enemyKillWeight += 3;
                if (enemyList[j].alias == 'demon') enemyKillWeight += 2;
                if (enemyList[j].alias == 'goul') enemyKillWeight += 1;


                castleHealth -= enemyList[j].damageToCastle;

                // Remove from enemy list
                enemyList[j].killed = true; // Remove from drawing
                enemiesKilled++;
            }
        }
    }

    for (var i = 0; i < enemyList.length; i++) {
        if (!enemyList[i].destroyed && enemyList[i].killed) enemyList[i].destroy();
    }

    // Move enemies
    for (var j = 0; j < enemyList.length; j++) {
        if (!enemyList[j].destroyed) enemyList[j].moveToCastle();
    }
}

var enemiesKilled = 0;
var enemyKillWeight = 0;

function spawnNewEnemies(round) {
    var numOfEnemies = Math.round(round * 1.75);

    if (round == 1) numOfEnemies = 5;
    if (round == 2) numOfEnemies = 7;

    for (var enemies = 0; enemies < numOfEnemies; enemies++) {
        var locationNum = randomIntFromInterval(0, spawnLocations.length - 1);
        var position = spawnLocations[locationNum].translate;

        var enemyNum = randomIntFromInterval(0,2);

        var damage = round*0.5;
        var HP = 100;
        var enemy = goul.getInstance();
        var speed = 0.02 + round/2000;

        // Goul
        if (enemyNum == 0) {
            damage += 1;
            HP += round*1.2;
            enemy = goul.getInstance();
            speed -= 0.005;
            enemy.scale(1.3,1.3,1.3);
        }
        // Demon
        if (enemyNum == 1) {
            damage += 1;
            HP += round*2.5;
            enemy = demon.getInstance();
            speed -= 0.009;
            enemy.scale(1.5,1.5,1.5);
        }
        // Skeleton
        if (enemyNum == 2) {
            damage += 2;
            HP += round*3.5;
            enemy = skeleton.getInstance();
            enemy.scale(1.8,1.8,1.8);
            speed -= 0.01;
        }

        enemy.speed = speed;
        enemy.damageToCastle += damage;
        enemy.translate(position[0],position[1],position[2]);

        window.models.push(enemy);
        enemyList.push(enemy);
    }



}
