/*******************************************************************
 ***** Axis Aligned Boudning Box (Simplified Collision Detection)
 *******************************************************************/

var AABB = function(initMin, initMax, camera) {
    this.vertexBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();

    this.isEnabled = true;

    this.max = initMax;
    this.min = initMin;

    this.initMin = initMin;
    this.initMax = initMax;

    this.vertices = [
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5
    ];

    this.indices = [
        // Bottom
        0,1,2,
        1,2,3,
        2,3,0,
        3,0,1,
        // Top
        4,5,6,
        5,6,7,
        6,7,4,
        7,4,0,
        // LEFT
        2,3,7,
        3,7,6,
        7,6,2,
        6,2,3,
        // RIGTH
        0,1,5,
        1,5,4,
        5,4,0,
        4,0,1
    ];

    this.initBuffers();

    this.modelMatrix = mat4.create();

    this.camera = camera;
    this.init = false;

    return this;
}

AABB.prototype.getBoundingBox = function() {
    return {
        'min': this.min,
        'max': this.max
    }
}

/** Wrap arounds model */
AABB.prototype.wrap = function(M) {
    this.modelMatrix = mat4.create();

    var size = [this.max[0]-this.min[0], this.max[1]-this.min[1], this.max[2]-this.min[2]];
    var centerOfObject = [(this.min[0] + this.max[0]) / 2, (this.min[1] + this.max[1]) / 2, (this.min[2] + this.max[2]) / 2];

    var translation = mat4.translate(mat4.create(),this.modelMatrix,[centerOfObject[0],centerOfObject[1],centerOfObject[2]]);
    var scale = mat4.scale(mat4.create(),this.modelMatrix,[size[0],size[1],size[2]]);
    mat4.multiply(this.modelMatrix,translation,scale);

    if (M) mat4.multiply(this.modelMatrix,M,this.modelMatrix);
}

AABB.prototype.initBuffers = function() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 3;
    this.vertexBuffer.numOfItems = this.vertices.length / 3;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    this.indicesBuffer.itemSize = 1;
    this.indicesBuffer.numOfItems = this.indices.length;
}

AABB.prototype.calculateMinMax = function(M) {
    var out = vec4.create();
    var matrix = [];
    var data = this.vertices;

    for (var vertex = 0; vertex < data.length; vertex += 3) {
        var x = data[vertex];
        var y = data[vertex+1];
        var z = data[vertex+2];

        out = vec4.transformMat4(out,[x,y,z,1], M);
        matrix.push(out[0]);
        matrix.push(out[1]);
        matrix.push(out[2]);
    }
    this.findMinMax(matrix);
}

AABB.prototype.findMinMax = function(matrix) {
    var maxX = matrix[0], maxY = matrix[1], maxZ = matrix[2];
    var minX = matrix[0], minY = matrix[1], minZ = matrix[2];

    for (var vertex = 0; vertex < matrix.length; vertex += 3) {
        var x = matrix[vertex];
        var y = matrix[vertex+1];
        var z = matrix[vertex+2];

        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (z > maxZ) maxZ = z;

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (z < minZ) minZ = z;
    }

    this.min = [minX,minY,minZ];
    this.max = [maxX,maxY,maxZ];
}

// Recalculate AABB from OBB
AABB.prototype.applyTransformationMatrix = function(M,TS, leave) {
    this.min = this.initMin;
    this.max = this.initMax;
    this.wrap(M);

    if (!leave) {
        // Construct AABB from OBB
        this.calculateMinMax(this.modelMatrix);
        this.wrap();
    }


}

AABB.prototype.setUniforms = function(camera) {
    gl.uniformMatrix4fv(wireframeProgram.pMatrixUniform, false, camera.getProjectionMatrix());
    gl.uniformMatrix4fv(wireframeProgram.mvMatrixUniform, false, this.modelMatrix);
    gl.uniformMatrix4fv(wireframeProgram.vMatrixUniform, false, camera.getViewMatrix());
}

// Check intersection with another AABB
AABB.prototype.isIntersect = function(bb) {
    var A = this.getBoundingBox();
    var B = bb.getBoundingBox();

    return (A['min'][0] <= B['max'][0] && A['max'][0] >= B['min'][0]) &&
        (A['min'][1] <= B['max'][1] && A['max'][1] >= B['min'][1]) &&
        (A['min'][2] <= B['max'][2] && A['max'][2] >= B['min'][2]);
}

// Check intersection with this AABB and given point
AABB.prototype.isPointInsideAABB = function(point) {
    var A = this.getBoundingBox();

    return (point[0] >= A['min'][0] && point[0] <= A['max'][0] &&
            point[1] >= A['min'][1] && point[1] <= A['max'][1] &&
            point[2] >= A['min'][2] && point[2] <= A['max'][2]);
}

AABB.prototype.draw = function() {
    if (SHOW_BOUNDINGBOX) {
        gl.useProgram(wireframeProgram);
        this.setUniforms(this.camera);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(wireframeProgram.vertexPositionAaVertexPositionttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

        gl.drawElements(gl.LINES, this.indicesBuffer.numOfItems, gl.UNSIGNED_SHORT, 0);
    }
}
