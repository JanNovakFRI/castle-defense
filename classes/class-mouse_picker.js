var mouse_canvas_lock = false;

function mouse_picking_on_click(e, mouse_picker) {
  var canvas = document.getElementById('canvas');
  var rect = canvas.getBoundingClientRect();
  var x = e.clientX - rect.left;
  var y = e.clientY - rect.top;
  if(x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
    var half_width = canvas.width/2;
    var half_height = canvas.height/2;
    x = (x - half_width)/half_width;
    y = -(y - half_height)/half_height;
    //console.log(x, y);
    mouse_ray(mouse_picker, x, y);
  }
}

//mp...mouse_picker
function mouse_ray(mp, x, y) {
  //ray[0] = x;
  //ray[1] = y;

  //homogeneous clip coords
  var ray = vec4.create();
  ray[0] = 0.0;
  ray[1] = 0.0;
  ray[2] = -1.0;
  ray[3] = 1.0;

  //eye coords
  var tmpMatrix = mat4.clone(mp.player.player_camera.getProjectionMatrix());
  mat4.invert(tmpMatrix, tmpMatrix);
  vec4.transformMat4(ray, ray, tmpMatrix);
  ray[3] = 0.0;

  //world coords
  tmpMatrix = mat4.clone(mp.player.player_camera.getViewMatrix());
  mat4.invert(tmpMatrix, tmpMatrix);
  vec4.transformMat4(ray, ray, tmpMatrix);

  mp.currentRay[0] = ray[0];
  mp.currentRay[1] = ray[1];
  mp.currentRay[2] = ray[2];

  vec3.normalize(mp.currentRay, mp.currentRay);

  //console.log("curr_ray: ", mp.currentRay, vec3.length(mp.currentRay));

}

//mp...mouse_picker
function find_intersection(mp, model) {

  var cam_pos = vec3.fromValues(mp.player.player_camera.xPosition, mp.player.player_camera.yPosition, mp.player.player_camera.zPosition);

  var click_dir = vec3.clone(mp.currentRay);
  vec3.scale(mp.currentRay, click_dir, 0.20687);

  //console.log("camera position:   ", cam_pos);
  //console.log("clicked direction: ", click_dir);

  //console.log("model: ", model.boundingBox);

  var curr_point = vec3.clone(cam_pos);

  for(var i = 1; i <= 400; i++) {

    //console.log("curr_point: ", curr_point, vec3.length(curr_point), i);
    //console.log(model.boundingBox.isPointInsideAABB(curr_point));
    if(model.boundingBox.isPointInsideAABB(curr_point)) {
      console.log("HIT: ", curr_point[0], curr_point[1], curr_point[2]);
      //console.log("HIT");
      //console.log(main_player.player_model);

      //example_spruce = spruce_1.getInstance();
      //window.models.push(example_spruce);
      //example_spruce.translate(curr_point[1], 0, curr_point[2] + 20);

      return true;
    }

    vec3.scale(click_dir, mp.currentRay, i);
    vec3.add(curr_point, click_dir, cam_pos);

  }

  return false;
}

function requestLock() {
  canvas = document.getElementById('canvas');

  if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
      canvas.requestPointerLock();
  }

  find_intersection(mouse_picker, example_spruce);
}

var Picker = function(player) {
  this.player = player;
  this.currentRay = vec3.create();
  return this;
}
