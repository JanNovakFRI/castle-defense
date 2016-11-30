var Arrow = function(player) {
    this.player = player;

    // Get copy of player and crossbow... for imaginary scene graph
    var arrow2 = arrow.getInstance();
    var player2 = this.player.player_model.getExactInstance();
    player2.setParent(window.rootNode);

    var crossbow2 = window.crossbow.getExactInstance();
    crossbow2.setParent(player2);

    arrow2.setParent(crossbow2);
    arrow2.translate(0,0.07,0.4);
    arrow2.scale(2.7,2.7,-2.7);
    this.arrow = arrow2;

    this.arrow2 = arrow2;
    this.player2 = player2;
    this.crossbow2 = crossbow2;

    this.arrow.transform();

    window.models.push(this.arrow);
    window.ammoClip.push(this.arrow);

    this.arrow.ref = this;
    this.destroyed = false;

    this.damage = 100;
    this.used = false;

    return this;
}

Arrow.prototype.destroy = function() {

    var index = window.models.indexOf(this);
    if (index > -1) window.models.splice(index,1);

    index = window.ammoClip.indexOf(this);
    if (index > -1) window.ammoClip.splice(index,1);

    this.destroyed = true;

    this.arrow2 = null;
    this.player2 = null;
    this.crossbow2 = null;
}

Arrow.prototype.update = function(elapsed) {
    this.arrow.translate(this.arrow.dx, this.arrow.dy, this.arrow.dz);
}
