/*******************************************************************
 ***** Model Class
 *******************************************************************/
var Model = function(filepath,camera) {
    this.modelLoaded = false;
    this.texturesLoaded = false;

    this.filepath = filepath;
    this.texturePath = false;
    this.data = [];

    this.dx = 0, this.dy = 0, this.dz = 0;
    this.rx = 0, this.ry = 0, this.rz = 0;
    this.sx = 1, this.sy = 1, this.sz = 1;

    this.mMatrixLocal = mat4.create();
    this.mMatrixGlobal = mat4.create();

    this.transformationMatrix = mat4.create(); // without rotation

    if (filepath == '') this.modelLoaded = true;

    this.boundingBox = false;
    this.camera = camera;

    if (filepath != '') {
        this.parent = rootNode;
        rootNode.children.push(this);
    }

    this.children = [];

    this.collisionCheck = true;

    this.oldPosition = [this.dx,this.dy,this.dz];

    this.alias = '';

    this.destroyed = false;
    this.health = 100;
    this.damageToCastle = 5;
    this.speed = 0.02;

    this.killed = false;

    return this;
}


Model.prototype.destroy = function() {
    var index = window.models.indexOf(this);
    if (index > -1) window.models.splice(index,1);

    this.destroyed = true;
}

Model.prototype.moveToCastle = function() {
    if (this.dx > 0) this.dx -= this.speed * elapsed/9;
    else this.dx += this.speed * elapsed/9;
    if (this.dz > 0) this.dz -= this.speed * elapsed/9;
    else this.dz += this.speed * elapsed/9;

    var v1 = this.dx - 0;
    var v2 = this.dy - 0;
    var v3 = this.dz - 0;

    this.ry = 180 + radToDeg(Math.atan2(this.dx,this.dz));
}

Model.prototype.reset = function() {
    this.mMatrixLocal = mat4.create();
    this.mMatrixGlobal = mat4.create();
    this.transformationMatrix = mat4.create();

    this.dx = 0, this.dy = 0, this.dz = 0;
    this.rx = 0, this.ry = 0, this.rz = 0;
    this.sx = 1, this.sy = 1, this.sz = 1;
}

Model.prototype.getInstance = function() {
    var instance = new Model(this.filepath,this.camera);
    instance.data = this.data;
    instance.modelLoaded = true;
    instance.texturesLoaded = true;
    instance.boundingBox = new AABB(this.data.getMinPoint(),this.data.getMaxPoint(),this.camera);
    return instance;
}

Model.prototype.getExactInstance = function() {
    var instance = new Model(this.filepath,this.camera);
    instance.data = this.data;
    instance.modelLoaded = true;
    instance.texturesLoaded = true;
    instance.boundingBox = new AABB(this.data.getMinPoint(),this.data.getMaxPoint(),this.camera);

    instance.dx = this.dx, instance.dy = this.dy, instance.dz = this.dz;
    instance.rx = this.rx, instance.ry = this.ry, instance.rz = this.rz;
    instance.sx = this.sx, instance.sy = this.sy, instance.sz = this.sz;
    return instance;
}

Model.prototype.updateWorldMatrix = function(parentWorldMatrix) {
  this.transform();

  if (parentWorldMatrix) mat4.multiply(this.mMatrixGlobal,parentWorldMatrix,this.mMatrixLocal);
  else mat4.copy(this.mMatrixGlobal,this.mMatrixLocal);

  var worldMatrix = this.mMatrixGlobal;

  this.children.forEach(function(child) {
    child.updateWorldMatrix(worldMatrix);
  });
};

Model.prototype.setParent = function(parent) {
    if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) this.parent.children.splice(ndx, 1);
    }

    if (parent) parent.children.push(this);
    this.parent = parent;
}

// Call loading, set loaded param callback, etc...
Model.prototype.init = function() {
    this.initBuffers();
}

// Load Parsed Model Data
Model.prototype.loadModel = function() {
    if (DEBUG) console.info('Loading model',this.filepath);
    var context = this;

    new FileReader(this.filepath, function(data) {
        context.data = new OBJParse(data, context.filepath, function() {
            context.waitTexturesToLoad( function(){
                context.initBuffers();
                context.boundingBox = new AABB(context.data.getMinPoint(),context.data.getMaxPoint(),context.camera);
            });
        });
    });
}

Model.prototype.setUniforms = function(camera) {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, camera.getProjectionMatrix());
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, this.mMatrixGlobal);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, camera.getViewMatrix());

    // Set normal matrix
    var normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix,this.mMatrixGlobal);
    mat3.invert(normalMatrix, normalMatrix);

    mat3.transpose(normalMatrix,normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

Model.prototype.waitTexturesToLoad = function(callback) {
    var texturesLoaded = true;
    for (var mat in this.data.materials) {
        if (!this.data.materials[mat].isLoaded()) {
            texturesLoaded = false;
            break;
        }
    }

    var ctx = this;
    if (!texturesLoaded) {
        setTimeout(function(){
            ctx.waitTexturesToLoad(callback);
        }, 100);
    }
    else {
        this.texturesLoaded = true;
        if (DEBUG) console.info('All textures are loaded for', ctx.filepath);
        callback();
    }
}

Model.prototype.initBuffers = function() {
    if (DEBUG) console.info('Initializing Model Buffers');

    for (var o in this.data.objects) {
        var object = this.data.objects[o];

        for (var m in object.materials) {
            var material = object.materials[m];

            // VERTICES
            // Convert to unindexed buffer [OBJ File Specification Limitation]
            var vertexData = convertToUnindexedBuffer(material.vertexIndices, this.data.vertices, 3);

            gl.bindBuffer(gl.ARRAY_BUFFER, material.vertexIndicesBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
            material.vertexIndicesBuffer.itemSize = 3;
            material.vertexIndicesBuffer.numOfItems = vertexData.length / 3;

            // UVS
            if (this.data.uvs.length > 0) {
                // Convert to unindexed buffer [OBJ File Specification Limitation]
                var uvsData = convertToUnindexedBuffer(material.uvIndices, this.data.uvs, 2);

                gl.bindBuffer(gl.ARRAY_BUFFER, material.uvIndicesBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvsData), gl.STATIC_DRAW);
                material.uvIndicesBuffer.itemSize = 2;
                material.uvIndicesBuffer.numOfItems = uvsData.length / 2;
            }

            // NORMALS
            if (this.data.normals.length > 0) {
                // Convert to unindexed buffer [OBJ File Specification Limitation]
                var normalsData = convertToUnindexedBuffer(material.normalIndices, this.data.normals, 3);

                gl.bindBuffer(gl.ARRAY_BUFFER, material.normalIndicesBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalsData), gl.STATIC_DRAW);
                material.uvIndicesBuffer.itemSize = 3;
                material.uvIndicesBuffer.numOfItems = normalsData.length / 3;
            }
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    this.modelLoaded = true;
    if (DEBUG) console.info('Model is completely loaded and ready to draw.');
}

Model.prototype.draw = function() {
    if (this.filepath == '') return;
    gl.useProgram(shaderProgram);

    this.ambientColor = new RGB(1,1,1);
    this.lightingDirection = [0,60,0];


    var adjustedLD = vec3.create();
    vec3.normalize(adjustedLD, this.lightingDirection);

    vec3.scale(adjustedLD,adjustedLD, -1);
    gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

    gl.uniform3f(shaderProgram.directionalColorUniform,
      parseFloat(this.ambientColor.r),
      parseFloat(this.ambientColor.g),
      parseFloat(this.ambientColor.b)
    );

    this.setUniforms(this.camera);

    for (var o in this.data.objects) {
        var object = this.data.objects[o];
        for (var m in object.materials) {
            var material = object.materials[m];

            // VERTICES
            gl.bindBuffer(gl.ARRAY_BUFFER, material.vertexIndicesBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

            // UVS
            if (this.data.uvs.length > 0 && material.material.hasTexture()) {
                gl.bindBuffer(gl.ARRAY_BUFFER, material.uvIndicesBuffer);
                gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

                if (material.material.mapKd.hasTexture()) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, material.material.mapKd.texture);
                    gl.uniform1i(shaderProgram.samplerUniform, 0);
                }
            }

            // NORMALS
            if (this.data.normals.length > 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, material.normalIndicesBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
            }

            gl.drawArrays(gl.TRIANGLES, 0, material.vertexIndicesBuffer.numOfItems);
        }
    }

    this.boundingBox.draw();
}

// Calculate final transformation matrix based on TRS
Model.prototype.transform = function(leave) {
    this.mMatrixLocal = mat4.create();
    this.transformationMatrix = mat4.create();

    // Translate
    mat4.translate(this.mMatrixLocal,this.mMatrixLocal,[this.dx,this.dy,this.dz]);

    // Rotate
    mat4.rotateX(this.mMatrixLocal,this.mMatrixLocal,degToRad(this.rx));
    mat4.rotateY(this.mMatrixLocal,this.mMatrixLocal,degToRad(this.ry));
    mat4.rotateZ(this.mMatrixLocal,this.mMatrixLocal,degToRad(this.rz));

    // Scale
    mat4.scale(this.mMatrixLocal,this.mMatrixLocal,[this.sx,this.sy,this.sz]);

    // TS for AABB
    mat4.translate(this.transformationMatrix,this.transformationMatrix,[this.dx,this.dy,this.dz]);
    mat4.scale(this.transformationMatrix,this.transformationMatrix,[this.sx,this.sy,this.sz]);


    if (this.boundingBox) {
        this.boundingBox.applyTransformationMatrix(this.mMatrixGlobal,this.transformationMatrix,leave);
    }
}

Model.prototype.translate = function(dx,dy,dz) {
	   this.dx = dx;
       this.dy = dy;
       this.dz = dz;
}

Model.prototype.rotateX = function(rx) {
       this.rx = rx % 360;
}

Model.prototype.rotateY = function(ry) {
       this.ry = ry % 360;
}

Model.prototype.rotateZ = function(rz) {
       this.rz = rz % 360;
}

Model.prototype.scale = function(sx,sy,sz) {
       this.sx = sx;
       this.sy = sy;
       this.sz = sz;
}
