/*******************************************************************
 ***** Camera Class 
 *******************************************************************/

var Camera = function(rx, rxr, ry, ryr, x, y, z) {
    this.rotX = rx;
	this.rotY = ry;
	this.xPosition = x;
	this.yPosition = y;
	this.zPosition = z;

	this.viewMatrix = mat4.create();
    this.perspectiveMatrix = mat4.create();
    mat4.perspective(this.perspectiveMatrix, degToRad(45), gl.viewportWidth/gl.viewportHeight, 0.1, 1000);

    return this;
}

Camera.prototype.getViewMatrix = function() {
    return this.viewMatrix;
}

Camera.prototype.getProjectionMatrix = function() {
    return this.perspectiveMatrix;
}

Camera.prototype.transform = function() {
	this.rotX = this.rotX % 360;
	this.rotY = this.rotY % 360;
	this.viewMatrix = mat4.create();
	mat4.rotate(this.viewMatrix, this.viewMatrix, degToRad(-this.rotX), [1, 0, 0]);
  	mat4.rotate(this.viewMatrix, this.viewMatrix, degToRad(-this.rotY), [0, 1, 0]);
  	mat4.translate(this.viewMatrix, this.viewMatrix, [-this.xPosition, -this.yPosition, -this.zPosition]);
}