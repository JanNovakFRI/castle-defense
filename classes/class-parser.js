var OBJObject = function(name) {
    this.name = name;

    // Data
    this.vertices = [];
    this.uvs = [];
    this.normals = [];

    // Materials
    this.materials = [];

    // Buffers
    this.verticesBuffer = gl.createBuffer();
    this.uvsBuffer = gl.createBuffer();
    this.normalsBuffer = gl.createBuffer();

    return this;
}

var OBJMaterial = function(name) {
    this.name = name;
    this.material = false;

    // Indices that belongs to material
    this.vertexIndices = [];
    this.uvIndices = [];
    this.normalIndices = [];

    // Buffers for Indices
    this.vertexIndicesBuffer = gl.createBuffer();
    this.uvIndicesBuffer = gl.createBuffer();
    this.normalIndicesBuffer = gl.createBuffer();

    return this;
}

/** OBJ File Reader Class */
var OBJParse = function(file, filepath, callback) {
    var ctx = this;
    this.mtllibs = [];
    this.objects = [];
    this.materials = []; // global MTLMaterial list

    this.vertices = [];
    this.uvs = [];
    this.normals = [];

    // Used for AABB calculation
    this.maxX = false,this.maxY = false,this.maxZ = false;
    this.minX = false,this.minY = false,this.minZ = false;

    this.base = getBasePath(filepath);

    var lines = file.split('\n');
    var currentObject = false;
    var currentMaterial = false;

    var initVertex = false;

    for (var line = 0; line < lines.length; line++) {
        var data = lines[line].split(' ');
        
        if (data[0] === 'mtllib') {
            this.mtllibs.push(data[1]);
        }
        if (data[0] === 'o') {
            currentObject = new OBJObject(data[1]);
            this.objects.push(currentObject);
        }
        if (data[0] === 'v') {
            var vX = parseFloat(data[1]);
            var vY = parseFloat(data[2]);
            var vZ = parseFloat(data[3]);   

            this.vertices.push(vX);
            this.vertices.push(vY);
            this.vertices.push(vZ);    

            if (!initVertex)
            {
                this.maxX = vX; this.maxY = vY; this.maxZ = vZ;
                this.minX = vX; this.minY = vY; this.minZ = vZ;
                initVertex = true;
            } else {
                if (vX > this.maxX) this.maxX = vX;
                if (vY > this.maxY) this.maxY = vY;
                if (vZ > this.maxZ) this.maxZ = vZ;

                if (vX < this.minX) this.minX = vX;
                if (vY < this.minY) this.minY = vY;
                if (vZ < this.minZ) this.minZ = vZ;
            }
        }
        if (data[0] === 'vt') {
            this.uvs.push(parseFloat(data[1]));
            this.uvs.push(parseFloat(data[2]));
        }
        if (data[0] === 'vn') {
            this.normals.push(parseFloat(data[1]));
            this.normals.push(parseFloat(data[2]));
            this.normals.push(parseFloat(data[3]));
        }
        if (data[0] === 'usemtl') {
            currentMaterial = new OBJMaterial(data[1]);
            currentObject.materials.push(currentMaterial);
        }
        if (data[0] === 'f') {
            for (var i = 0; i < 3; i++) {
                if (data[i+1].indexOf("//") > 0) {
                    var v = data[i+1].split('//');
                    currentMaterial.vertexIndices.push(parseInt(v[0])-1);
                    currentMaterial.normalIndices.push(parseInt(v[1])-1);
                } else if (data[i+1].indexOf("/") > 0) {
                    var v = data[i+1].split('/');
                    currentMaterial.vertexIndices.push(parseInt(v[0])-1);
                    currentMaterial.uvIndices.push(parseInt(v[1])-1);
                    currentMaterial.normalIndices.push(parseInt(v[2])-1);
                }

                // Handle exception when object has no material
                if (!currentMaterial) {
                    // Attach default material
                    currentMaterial = new OBJMaterial(false);
                    currentObject.materials.push(currentMaterial);
                }
                
            }         
        }
    }

    // Parse library file - ASYNC
    new FileReader(ctx.base + this.mtllibs[0], function(text){
        var mtlParser = new MTLParse(text, ctx.base);
        ctx.materials = mtlParser.materials;
        
        for (var mat in ctx.materials) {
            ctx.materials[mat].loadTextures();
        }

        // Assign material to each OBJMaterial in all bojects
        for (var o in ctx.objects) { // Objects
            for (var m in ctx.objects[o].materials) { // OBJMaterials
                for (var i in ctx.materials) { // MTLMaterials
                    // if MTLMaterial.name === OBJMaterial.name
                    if (ctx.materials[i].name === ctx.objects[o].materials[m].name)
                    {
                        ctx.objects[o].materials[m].material = ctx.materials[i];
                        break;
                    }
                }
            }
        }

        callback();
    });

    return this;
}

OBJParse.prototype.getMaxPoint = function() {
    return [this.maxX,this.maxY,this.maxZ];
}

OBJParse.prototype.getMinPoint = function() {
    return [this.minX,this.minY,this.minZ];
}

var TextureMap = function() {
    this.path = '';
    this.isLoaded = false;
    this.image = false;
    this.texture = false;
    return this;
}

TextureMap.prototype.hasTexture = function() {
    return this.path != '';
}

var RGB = function(r,g,b) {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
}

var MTLMaterial = function(name) {
    this.orphan = false;

    if (!name) {
        name = '';
        this.orphan = true;
    }

    this.name = name;

    this.mapKa = new TextureMap();
    this.mapKd = new TextureMap();

    this.mapKa.isLoaded = false;
    this.mapKd.isLoaded = false;

    this.colorDiffuse = new RGB(1.0,1.0,1.0);
    this.colorSpecular = new RGB(1.0,1.0,1.0);

    return this;
}

MTLMaterial.prototype.hasTexture = function() {
    return this.mapKa.hasTexture() || this.mapKd.hasTexture();
}

MTLMaterial.prototype.loadTextures = function() {
    var ctx = this;
    if (DEBUG) console.info('Loading textures...');
    if (this.mapKa.path != '') {
        new ImageReader(this.mapKa.path, function(image){
            ctx.mapKa.image = image;
            ctx.mapKa.isLoaded = true;

            ctx.mapKa.texture = createTexture(image);

            if (DEBUG) console.info('Texture loaded...',image.src);
        });
    }
    
    if (this.mapKd.path != '') {
        new ImageReader(this.mapKd.path, function(image){
            ctx.mapKd.image = image;
            ctx.mapKd.isLoaded = true;

            ctx.mapKd.texture = createTexture(image);

            if (DEBUG) console.info('Texture loaded...',image.src);
        });
    }
}

MTLMaterial.prototype.isLoaded = function() {
    if (this.mapKd.path == '' && this.mapKa.path == '') {
        console.error('Material has no attached textures.');
        return true;
    }
    else if (this.mapKd.path != '' && this.mapKa.path != '') {
        return this.mapKa.isLoaded && this.mapKd.isLoaded;
    }
    else if (this.mapKd.path != '') {
        return this.mapKd.isLoaded;
    }
    else if (this.mapKa.path != '') {
        return this.mapKa.isLoaded;
    }
    return false;
}

var MTLParse = function(data, base) {
    if (DEBUG) console.info('Parsing mtlib...');
    this.materials = [];
    currentMaterial = false;

    var lines = data.split('\n');
    for (var line in lines) {
        var data = lines[line].split(' ');

        if (data[0] === 'newmtl') {
            currentMaterial = new MTLMaterial(data[1]);
            this.materials.push(currentMaterial);
        }
        if (data[0] === 'map_Ka') {
            currentMaterial.mapKa.path = base + data[1];
        }
        if (data[0] === 'map_Kd') {
            currentMaterial.mapKd.path = base + data[1];
        }
        if (data[0] === 'Kd') {
            currentMaterial.colorDiffuse = new RGB(
                parseFloat(data[1]),
                parseFloat(data[2]),
                parseFloat(data[3])
            );
        }
        if (data[0] === 'Ks') {
            currentMaterial.colorSpecular = new RGB(
                parseFloat(data[1]),
                parseFloat(data[2]),
                parseFloat(data[3])
            );
        }
    }

    return this;
}