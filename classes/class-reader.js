/*******************************************************************
 ***** Reader Class 
 *******************************************************************/

var FileReader = function(path, callback) {
    var request = new XMLHttpRequest();

    request.open("GET", path);
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        callback(request.responseText);
      }
    }
    request.send();

    return this;
}

var ImageReader = function(path, callback) {
  var image = new Image();
  image.onload = function(){
      callback(image);   
  };
  image.src = path;
}