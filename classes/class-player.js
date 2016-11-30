/*******************************************************************
 ***** Player Class
 *******************************************************************/

 var Player = function(x, y, z, rotX, rotY, rotZ) {

 	this.player_camera = new Camera(rotX, 0, rotY, 0, x, y, z);

 	this.distance_from_player = 5.0;
 	this.angle_around_player = 0.0;
 	this.camera_pitch = 10.0;

 	this.player_speed = 0.0;
 	this.player_side_speed = 0.0;
 	this.player_ratex = 0.0;
	this.player_ratey = 0.0;
}

Player.prototype.setModel = function(x, y, z, rotX, rotY, rotZ, model) {
	this.player_model = model;
 	this.player_model.dx = x;
 	this.player_model.dy = y;
 	this.player_model.dz = z;
 	this.player_model.rx = rotX;
 	this.player_model.ry = rotY;
 	this.player_model.rz = 0.0;
 	this.player_model.sx = 1.0;
 	this.player_model.sy = 1.0;
 	this.player_model.sz = -1.0;
}

Player.prototype.move_straight = function(s) {
	this.player_speed = s;
}

Player.prototype.move_sides = function(s) {
	this.player_side_speed = s;
}

Player.prototype.rotateX = function(rx) {
	this.player_ratex = rx;
}

Player.prototype.rotateY = function(ry) {
	this.player_ratey = ry;
}

Player.prototype.transform = function(elapsed) {
	this.transformModel(elapsed);
	this.transformCamera_3rd_person(elapsed);
}

 Player.prototype.transformCamera_3rd_person = function(elapsed) {

 	this.angle_around_player = this.angle_around_player % 360;

 	var vd = this.distance_from_player * Math.sin(degToRad(this.camera_pitch));
	var hd = this.distance_from_player * Math.cos(degToRad(this.camera_pitch));

    // Limit camera angle
    if (-this.camera_pitch < -65) this.camera_pitch = 65;
    if (-this.camera_pitch > 30) this.camera_pitch = -30;

 	this.player_camera.rotX = -this.camera_pitch;
 	this.player_camera.rotY = (this.player_model.ry);

    window.crossbow.rx = this.camera_pitch + 1;

	var theta = this.player_camera.rotY + this.angle_around_player;
	var offSetX = hd * Math.sin(degToRad(theta));
	var offSetZ = hd * Math.cos(degToRad(theta));

	this.player_camera.rotY = theta;

	this.player_camera.yPosition = this.player_model.dy + vd + 3.6; // + 3.6 da je kamera malo nad modelom(knight)
	this.player_camera.xPosition = this.player_model.dx + offSetX;
	this.player_camera.zPosition = this.player_model.dz + offSetZ - 20;

	this.player_camera.transform();
}

Player.prototype.checkValidMove = function(newDx,newDz) {
    var bb = knight.boundingBox;

    for (var i = 0; i < window.models.length; i++) {
        if (window.models[i].filepath == "" || window.models[i].filepath == 'models/characters/knight/knight.obj') continue;
        if (!EDITOR_MODE) {
            if (newDx > 5.3 || newDx < -5.3 ) return false;
            if (newDz > 5.23 || newDz < -5.23 ) return false;
        }
    }
    return true;
}

Player.prototype.transformModel = function(elapsed) {

	if(this.player_speed != 0 || this.player_side_speed != 0) {

        var oldDx = this.player_model.dx;
        var oldDz = this.player_model.dz;

        this.player_model.dx -= Math.sin(degToRad(this.player_model.ry)) * this.player_speed * elapsed;
        this.player_model.dz -= Math.cos(degToRad(this.player_model.ry)) * this.player_speed * elapsed;

        this.player_model.dx -= Math.sin(degToRad((this.player_model.ry + 90) % 360)) * this.player_side_speed * elapsed;
        this.player_model.dz -= Math.cos(degToRad((this.player_model.ry + 90) % 360)) * this.player_side_speed * elapsed;

        if (!this.checkValidMove(this.player_model.dx,this.player_model.dz )) {
            this.player_model.dx = oldDx;
            this.player_model.dz = oldDz;
        }
	}

	this.player_model.ry += (this.player_ratey * elapsed) % 360;
	this.player_model.rz += (this.player_ratex * elapsed) % 360;
	this.player_model.transform();
}
