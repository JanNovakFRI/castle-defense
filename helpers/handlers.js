// ############################################################################
// #### HANDLERS.JS - Handle mouse,key,lock change events #####################
// ############################################################################

/*
 * Respond on mouse down callback
 */
function handleMouseDown(event) {
    if (event.which == 3) {
        mouseDown_right = true;
    } else if (event.which == 2) {
        mouseDown_mid = true;
    } else if (event.which == 1) {
        mouseDown_left = true;
    }
    lastMouseXDown = event.clientX;
    lastMouseYDown = event.clientY;
}

/*
 * Respond on mouse up callback
 */
function handleMouseUp(event) {
    if (event.which == 3) {
        mouseDown_right = false;
    } else if (event.which == 2) {
        mouseDown_mid = false;
    } else if (event.which == 1) {
        mouseDown_left = false;
    }

    // Shoot
    if (mouse_canvas_lock) {
        new Arrow(main_player);
    }
}

/*
 * Respond on pressed down keys
 */
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

/*
 * Respond on pressed up keys
 */
function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;

    if (event.keyCode == 57) { // NUMPAD: 9
        SHOW_BOUNDINGBOX = SHOW_BOUNDINGBOX ? false : true;
    } else if (event.keyCode == 56) { // NUMPAD: 8
        SHOW_CROSSHAIR = SHOW_CROSSHAIR ? false : true;
    }

    /* EDITOR MODE */
    if (EDITOR_MODE) {
        if (event.keyCode == 32) { // SPACE
            var spruce_tmp = spruce_1.getInstance();
            window.models.push(spruce_tmp);
            spruce_tmp.translate(knight.dx, 0, knight.dz);
            window.spruces.push({ "model" : "spruce_1", "translate": [knight.dx, 0, knight.dz] });
        }

        if (event.keyCode == 80) { // P
            // Drop the spruce
            console.log(window.spruces);
        }

        if (event.keyCode == 88) { // X
            // Remove last spruce
            if (window.spruces.length > 0) window.spruces.pop();
            window.models.pop();
        }
    }

}

var spruces = [];

/*
 * Respond on mouse move event
 */
function handleMouseMove(event) {
    var deltaY = event.movementX;
    var deltaX = event.movementY;

    if (mouse_canvas_lock) {
        mouse_picking_on_click(event, mouse_picker);
        main_player.camera_pitch += deltaX / 2;
        main_player.player_ratey -= deltaY / 30;


        if (mouseDown_mid) {
            main_player.camera_pitch += deltaX;
            main_player.angle_around_player -= deltaY;
        }
    }
}

/*
 * Respond on pressed keys
 */
function handleKeys() {
    var speed = 0.004;
    var rotate_speed = 0.1;

    if (EDITOR_MODE) speed = 0.008;

    // Keyboard - move forward/backward
    if (currentlyPressedKeys[87]) main_player.move_straight(speed); // W
    else if (currentlyPressedKeys[83]) main_player.move_straight(-speed); // S
    else main_player.move_straight(0.0);

    if (currentlyPressedKeys[65]) main_player.move_sides(speed); // A
    else if (currentlyPressedKeys[68]) main_player.move_sides(-speed); // D
    else main_player.move_sides(0.0);

    // Keyboard - rotate around Y axis
    if (currentlyPressedKeys[81]) main_player.rotateY(rotate_speed); // Q
    else if (currentlyPressedKeys[69]) main_player.rotateY(-rotate_speed); // E
    else main_player.rotateY(0.0);
}

/*
 * Respond on mouse lock change callback
 */
function lockChange() {
    var canvas = document.getElementById('canvas');

    if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) mouse_canvas_lock = true;
    else mouse_canvas_lock = false;
}

/*
 * Respond on mouse wheel change callback
 */
function wheel(e) {
    if (!e) e = window.event;
    var delta = e.wheelDelta ? e.wheelDelta : -e.detail / 3;

    if (delta > 0) {
        main_player.distance_from_player -= 0.5;
    } else if (delta < 0) {
        main_player.distance_from_player += 0.5;
    }

}
