////////////////////////////////////
// UTOMATA JS
//////////////////////////////////
/*
  A javascript library for Cellular Automata
  liorbengai 2020
  labofbabel.org

  VANILLA VERSION
*/

/*

TODO:

- add uniforms externally
- implement zoom to multiply the canvas size in css
- read from input image


BUGS:
- eql doesn't work
- random doesn't work
- REPEAT doesn't work

*/

function utomata(_wid, _hei)
{
  var _this = this;

  // all structure parameters
  var params = {
    width: _wid,
    height: _hei,
    transition: "V = vec4(0.0, 1.0, 0, 1.0);",
    config: "vec4(1.0, 0, 0, 1.0)",
    doConfig: 1,
    edge: "REPEAT",
    fps: 60,
    zoom: 1,
    step: 0,
    mouseDown: 0,
    mouseOver: 0,
    mouseX: 0,
    mouseY: 0,
    startTime: Date.now(),
    randSeed: 12341324.012341234,
  }

  // an array of key value pairs to use as uniforms for the shader
  var uniforms = [];

  // GL vars
  var canvas, gl, buffer, currentProgram, vertexPosition;
  var frontTarget, backTarget, screenProgram;

  var errors = [];

  var running = true;
  var fpsInterval = 1000/params.fps;

  var then = Date.now();
  var startTime = then;
  var now, elapsed;

  var initImage;
  var usingInitImage = false;


  if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
      return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function ( callback, element ) {
        window.setTimeout( callback, 1000 / 60 );
      };
    } )();
  }


  init();
  animate();

  // GO / STOP


  this.run = function(_transition){

    params.transition = _transition;
    params.startTime =  Date.now();
    running = true;

    compile();
  }

  this.stop = function(_transition){
    running = false;
  }


  // SETTERS

  this.config = function(){
    // if(_conf !== 'undefined'){
    //   params.config = _conf;
    // }
    params.doConfig = 1;
  }

  this.fps = function(_fps){
    params.fps = _fps;
    fpsInterval = 1000/params.fps;
  }


  // TODO: USE IN PROGRAM
  this.edge = function(_edge){
    if( _edge == "REPEAT" ){
      params.edge = "REPEAT";
    }else{
      params.edge = "CLAMP_TO_EDGE";
    }
    updateCanvasSize();
  }


  this.size = function(w, h){

    params.width =parseInt(w);
    params.height =parseInt(h);

    updateCanvasSize();
    zoomCanvas();
  }




  // GETTERS
  this.errors = function(){
    return errors;
  }


  this.zoom = function(newZ){
    params.zoom = Math.round(newZ);
    zoomCanvas();
  }




  function init() {

    // create #mainCanvas
  	var container = document.createElement( 'div' );
    container.id = "mainCanvasContainer"
  	document.body.appendChild( container );

  	canvas = document.createElement( 'canvas' );
    canvas.id = "mainCanvas";
  	container.appendChild( canvas );

  	// Initialise WebGL
  	try {
      gl = canvas.getContext( 'experimental-webgl', {preserveDrawingBuffer: true} );
  	} catch( error ) { }

  	if ( !gl ) {
      alert("WebGL not supported on this browser. Please use Chrome/Safari/Firefox");
      throw "cannot create webgl context";
  	}

  	// Create vertex buffer (2 triangles)
  	buffer = gl.createBuffer();
  	gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
  	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [ - 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0 ] ), gl.STATIC_DRAW );

    updateCanvasSize();

    canvas.addEventListener( 'mousedown', function ( event ) {
      params.mouseDown = 1;
    }, false );

    canvas.addEventListener( 'mouseup', function ( event ) {
      params.mouseDown = 0;
    }, false );

    canvas.addEventListener( 'mouseover', function ( event ) {
      params.mouseOver = 1;
      //$("#mouseCoords").show();
    }, false );

    canvas.addEventListener( 'mouseout', function ( event ) {
      params.mouseOver = 0;
      //$("#mouseCoords").hide();
    }, false );

    canvas.addEventListener( 'mousemove', function ( event ) {

      var rect = canvas.getBoundingClientRect();
      var clientX = (event.clientX - rect.left) / params.zoom;
      var clientY = (event.clientY - rect.top) / params.zoom;

      params.mouseX = clientX / params.width;
      params.mouseY = 1 - ( (clientY) / (params.height) )  ;

    }, false );


    compile();
  	compileScreenProgram();

  }

  function decimal(n, d){
      var a = Math.pow(10,d);
      return Math.round(n * a) / a;
  }


  function compile() {

    console.log("compiling: " + params.transition);

    var program = gl.createProgram();

    fragment = getUtoFragA() + params.transition +  getUtoFragB();

    var vs = createShader( 'attribute vec3 position; void main() { gl_Position = vec4( position, 1.0 ); }', gl.VERTEX_SHADER );
    var fs = createShader( fragment, gl.FRAGMENT_SHADER );

    if ( vs == null || fs == null ){
        return null;
    }

    gl.attachShader( program, vs );
    gl.attachShader( program, fs );
    gl.deleteShader( vs );
    gl.deleteShader( fs );

    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
      return;
    }

    currentProgram = program;

    // Cache uniforms
    cacheUniformLocation( program, 'time' );
    cacheUniformLocation( program, 'mouse' );
    cacheUniformLocation( program, 'mouseDown' );
    cacheUniformLocation( program, 'resolution' );
    cacheUniformLocation( program, 'backbuffer' );
    cacheUniformLocation( program, 'doConfig' );
    cacheUniformLocation( program, 'randSeed' );

    // Load program into GPU
    gl.useProgram( currentProgram );

    // Set up buffers
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
    gl.vertexAttribPointer( vertexPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

  }

  function compileScreenProgram() {

    var program = gl.createProgram();
    var fragment = getFragmentShader();
    var vertex = getVertexShader();

    var vs = createShader( vertex, gl.VERTEX_SHADER );
    var fs = createShader( fragment, gl.FRAGMENT_SHADER );

    gl.attachShader( program, vs );
    gl.attachShader( program, fs );

    gl.deleteShader( vs );
    gl.deleteShader( fs );

    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
      console.error( 'VALIDATE_STATUS: ' + gl.getProgramParameter( program, gl.VALIDATE_STATUS ), 'ERROR: ' + gl.getError() );
      return;
  	}

  	screenProgram = program;

  	cacheUniformLocation( program, 'resolution' );
  	cacheUniformLocation( program, 'texture' );

  }

  function cacheUniformLocation( program, label ) {

    if ( program.uniformsCache === undefined ) {
      program.uniformsCache = {};
    }
    program.uniformsCache[ label ] = gl.getUniformLocation( program, label );
  }


  function createRenderTargets() {
    frontTarget = createBackTarget(params.width, params.height );
    backTarget = createBackTarget(params.width, params.height );
  }

  function createBackTarget(width, height ) {

    var target = {};
    target.framebuffer = gl.createFramebuffer();
    target.renderbuffer = gl.createRenderbuffer();
    target.texture = gl.createTexture();

    gl.bindTexture( gl.TEXTURE_2D, target.texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );

    // TODO: this is not working 31.5.2019
    if(params.edge == "REPEAT" && isPowTwoSize()){
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );

    }else {
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    }

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );

    gl.bindFramebuffer( gl.FRAMEBUFFER, target.framebuffer );
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0 );

    // set up renderbuffer
    gl.bindRenderbuffer( gl.RENDERBUFFER, target.renderbuffer );
    gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height );
    gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.renderbuffer );

    // clean up
    gl.bindTexture( gl.TEXTURE_2D, null );
    gl.bindRenderbuffer( gl.RENDERBUFFER, null );
    gl.bindFramebuffer( gl.FRAMEBUFFER, null);

    return target;
  }


  //LOAD AN IMAGE
  function loadImage(url) {

    initImage = new Image();
    initImage.crossOrigin = "";
    initImage.src = url;
    initImage.onload = function() {

      var width = this.width;
      var height = this.height;

      params.width = width;
      params.height = height;

      canvas.width = params.width;
      canvas.height = params.height;

      params.width = canvas.width;
      params.height = canvas.height;


      zoomCanvas();

      setTargetsToImage();
      params.step = 0;
    };
  }

  function setTargetsToImage(){

      var target = {};
      target.framebuffer = gl.createFramebuffer();
      target.renderbuffer = gl.createRenderbuffer();
      target.texture = gl.createTexture();

      gl.viewport( 0, 0, canvas.width, canvas.height );

      // set up framebuffer
      gl.bindTexture( gl.TEXTURE_2D, target.texture );
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, initImage );

      if(params.edge == "REPEAT" && isPowTwoSize()){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
      }else {
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
      }

      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
      //gl.generateMipmap(gl.TEXTURE_2D);

      gl.bindFramebuffer( gl.FRAMEBUFFER, target.framebuffer );
      gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0 );

      // set up renderbuffer
      gl.bindRenderbuffer( gl.RENDERBUFFER, target.renderbuffer );

      gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, params.width, params.height );
      gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.renderbuffer );

      // clean up
      gl.bindTexture( gl.TEXTURE_2D, null );
      gl.bindRenderbuffer( gl.RENDERBUFFER, null );
      gl.bindFramebuffer( gl.FRAMEBUFFER, null);

      // set render targets
      backTarget = target;
      frontTarget = createBackTarget(params.width, params.height );
      usingInitImage = true;
  }

  function isPowTwoSize(){

    var x = params.width;
    while (((x % 2) == 0) && x > 1){
      x /= 2;
    } /* While x is even and > 1 */

    var y = params.height;
    while (((y % 2) == 0) && x > 1){
      y /= 2;
    } /* While x is even and > 1 */
    return ( (x == 1) && (y == 1) );

  }



  function createShader( src, type ) {

    var shader = gl.createShader( type );
    var line, lineNum, lineError, index = 0, indexEnd;

    var linesInStartFrag = getUtoFragA().split('\n').length - 1 ;


    while (errors.length > 0) {
      line = errors.pop();
    }

    gl.shaderSource( shader, src );
    gl.compileShader( shader );

    if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {

      var error = gl.getShaderInfoLog( shader );

      // Remove trailing linefeed, for FireFox's benefit.
      while ((error.length > 1) && (error.charCodeAt(error.length - 1) < 32)) {
        error = error.substring(0, error.length - 1);
      }

      errors = [];

      while (index >= 0) {
        index = error.indexOf("ERROR: 0:", index);
        if (index < 0) { break; }
        index += 9;
        indexEnd = error.indexOf(':', index);
        if (indexEnd > index) {
          lineNum = parseInt(error.substring(index, indexEnd)) - linesInStartFrag;
          if ((!isNaN(lineNum)) && (lineNum > 0)) {
            index = indexEnd + 1;
            indexEnd = error.indexOf("ERROR: 0:", index);
            lineError = htmlEncode((indexEnd > index) ? error.substring(index, indexEnd) : error.substring(index));
            // line = code.setMarker(lineNum - 1, '<abbr title="' + lineError + '">' + lineNum + '</abbr>', "errorMarker");
            //code.setLineClass(line, "errorLine");
            errors.push(line);

            errors.push("ERROR in Line " +lineNum+" >> "+ lineError);
          }
        }
      }

      console.error(errors);

      return null;

    }else{
      // no errors
      // $("#console").html(" ");
      // $("#console").hide();
    }

    return shader;

  }


  // todo: does that not just mean make a new instance?

  function updateCanvasSize(){

    canvas.width = params.width;
    canvas.height = params.height;

    zoomCanvas();

    params.width = canvas.width;
    params.height = canvas.height;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    createRenderTargets();
    params.step = 0;
  }

  function zoomCanvas(){
    canvas.style.width = params.width * params.zoom + 'px';
    canvas.style.height = params.height* params.zoom + 'px';
  }


  function animate() {
    requestAnimationFrame( animate );

    now = Date.now();
    elapsed = now - then;

    if(running == true && (elapsed > fpsInterval) ){
      then = now - (elapsed % fpsInterval);
      render();
      params.step += 1;
    }

  }

  function render() {

    if ( !currentProgram ) return;

    params.time = Date.now() - params.startTime;

    // Set uniforms for custom shader

    gl.useProgram( currentProgram );

    gl.uniform1f( currentProgram.uniformsCache[ 'time' ], params.time / 1000 );
    gl.uniform2f( currentProgram.uniformsCache[ 'mouse' ], params.mouseX, params.mouseY );
    gl.uniform2f( currentProgram.uniformsCache[ 'resolution' ], params.width, params.height );
    gl.uniform1i( currentProgram.uniformsCache[ 'backbuffer' ], 0 );
    gl.uniform1i( currentProgram.uniformsCache[ 'doConfig' ], params.doConfig );
    gl.uniform1i( currentProgram.uniformsCache[ 'mouseDown' ], params.mouseDown );
    gl.uniform1f( currentProgram.uniformsCache[ 'randSeed' ], params.randSeed );

    // TODO: instead of a slider use the uniforms array in a loop here
    //gl.uniform1f( currentProgram.uniformsCache[ 'slider' ], AdaptiveSlider.val );

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, backTarget.texture );

    // Render custom shader to front buffer

    gl.bindFramebuffer( gl.FRAMEBUFFER, frontTarget.framebuffer );

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, 6 );

    // Set uniforms for screen shader

    gl.useProgram( screenProgram );

    gl.uniform2f( screenProgram.uniformsCache[ 'resolution' ], params.width, params.height );
    gl.uniform1i( screenProgram.uniformsCache[ 'texture' ], 1 );

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, frontTarget.texture );

    // Render front buffer to screen

    gl.bindFramebuffer( gl.FRAMEBUFFER, null );

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, 6 );

    // Swap buffers

    var tmp = frontTarget;
    frontTarget = backTarget;
    backTarget = tmp;

    // config can only happen once
    params.doConfig = 0;
  }

  function htmlEncode(str){

    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  }

  function saveImage(returnType) {


    var dataURL = canvas.toDataURL("image/png");

    // The returnType argument specifies how to get the
    // the image.  'obj' will set the source to an image element.
    // 'window' will open a new window and display the image.
    // 'download' will prompt the user to save the image.
    switch(returnType) {
      case 'obj':
        var imgObj = new Image();
        imgObj.src = dataURL;
        document.getElementById('graphics').appendChild(imgObj);
        break;
      case 'window':
        window.open(dataURL, "Canvas Image");
        break;
      case 'download':
        dataURL = dataURL.replace("image/png", "image/octet-stream");
        document.location.href = dataURL;
        break;
    }
  }


  function getUtoFragA(){

      var res = `
    //////////////////////////////////////////
    //
    // ETCETERA
    //
    //////////////////////////////////////////

    #define PI 3.14159265358979323846
    #define E 2.71828182845904523536
    #define G 1.61803398874989484820
    #define SQ2 1.41421356237309504880

    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float time;
    uniform vec2 mouse;
    uniform vec2 resolution;
    uniform sampler2D backbuffer;

    uniform int doConfig;
    uniform int mouseDown;
    uniform float randSeed;

    // ETC functions

    // ADDITION
    vec4 add(vec4 a, vec4 b){return a + b;}
    float add(float a, float b){return a + b;}
    vec4 add(float a, vec4 b){return vec4(a) + b;}
    vec4 add(vec4 a, float b){return a + vec4(b);}
    vec4 add(vec4 a){return a;}
    float add(float a){return a;}

    // MULTIPLICATION
    vec4 mlt(vec4 a, vec4 b){return a * b;}
    float mlt(float a, float b){return a * b;}
    vec4 mlt(float a, vec4 b){return vec4(a) * b;}
    vec4 mlt(vec4 a, float b){return a * vec4(b);}
    vec4 mlt(vec4 a){return a;}
    float mlt(float a){return a;}

    // SUBTRACTION
    vec4 sub(vec4 a, vec4 b){return a - b;}
    float sub(float a, float b){return a - b;}
    vec4 sub(float a, vec4 b){return vec4(a) - b;}
    vec4 sub(vec4 a, float b){return a - vec4(b);}
    vec4 sub(vec4 a){return -a;}
    float sub(float a){return -a;}

    // DIVISION
    vec4 div(vec4 a, vec4 b){return a / b;}
    float div(float a, float b){return a / b;}
    vec4 div(float a, vec4 b){return vec4(a) / b;}
    vec4 div(vec4 a, float b){return a / vec4(b);}
    vec4 div(vec4 a){return a;}
    float div(float a){return a;}

    // EXPONENTIATION
    vec4 pw(float a, vec4 b){return pow(vec4(a), b);}
    vec4 pw(vec4 a, float b){return pow(a, vec4(b));}
    vec4 pw(vec4 a){return a;}
    float pw(float a){return a;}

    // NATURAL LOGARITHM
    vec4 lg(vec4 a, vec4 b){return log(a);}
    float lg(float a, float b){return log(a);}
    float lg(float a){return log(a);}
    float lg(float a, vec4 b){return log(a);}
    vec4 lg(vec4 a, float b){return log(a);}

    // SQUARE ROOT
    vec4 sqt(vec4 a){return sqrt(a);}
    float sqt(float a){return sqrt(a);}
    vec4 sqt(vec4 a, vec4 b){return sqrt(a);}
    float sqt(float a, float b){return sqrt(a);}
    float sqt(float a, vec4 b){return sqrt(a);}
    vec4 sqt(vec4 a, float b){return sqrt(a);}

    // SIGN
    vec4 sgn(vec4 a){return sign(a);}
    float sgn(float a){return sign(a);}
    vec4 sgn(vec4 a, vec4 b){return sign(a);}
    float sgn(float a, float b){return sign(a);}
    float sgn(float a, vec4 b){return sign(a);}
    vec4 sgn(vec4 a, float b){return sign(a);}

    // STEP
    vec4 stp(vec4 a, vec4 b){return step(a,b);}
    float stp(float a, float b){return step(a,b);}
    vec4 stp(float a, vec4 b){return step(vec4(a), b);}
    vec4 stp(vec4 a, float b){return step(a, vec4(b));}
    vec4 stp(vec4 a){return vec4(1.0);}
    float stp(float a){return 1.0;}

    // EQUALITY
    vec4 eql(vec4 a, vec4 b){return stp(a,b) * stp(b,a);}
    float eql(float a, float b){return stp(a,b) * stp(b,a);}
    vec4 eql(vec4 a, float b){return stp(a,vec4(b)) * stp(vec4(b),a);}
    vec4 eql(float a, vec4 b){return stp(vec4(a),b) * stp(b,vec4(a));}
    vec4 eql(vec4 a){return vec4(1.0);}
    float eql(float a){return 1.0;}

    // CEILING
    vec4 cil(vec4 a){return ceil(a);}
    float cil(float a){return ceil(a);}
    vec4 cil(vec4 a, vec4 b){return ceil(a);}
    float cil(float a, float b){return ceil(a);}
    float cil(float a, vec4 b){return ceil(a);}
    vec4 cil(vec4 a, float b){return ceil(a);}

    // FLOOR
    vec4 flr(vec4 a){return floor(a);}
    float flr(float a){return floor(a);}
    vec4 flr(vec4 a, vec4 b){return floor(a);}
    float flr(float a, float b){return floor(a);}
    float flr(float a, vec4 b){return floor(a);}
    vec4 flr(vec4 a, float b){return floor(a);}

    // ROUNDING
    vec4 rnd(vec4 a){return floor(a) + step(0.5,fract(a));}
    float rnd(float a){return floor(a) + step(0.5,fract(a));}
    vec4 rnd(vec4 a, vec4 b){return floor(a) + step(0.5,fract(a));}
    float rnd(float a, float b){return floor(a) + step(0.5,fract(a));}
    float rnd(float a, vec4 b){return floor(a) + step(0.5,fract(a));}
    vec4 rnd(vec4 a, float b){return floor(a) + step(0.5,fract(a));}

    // ABSOLUTE VALUE
    vec4 ab(vec4 a, vec4 b){return abs(a);}
    float ab(float a, float b){return abs(a);}
    float ab(float a, vec4 b){return abs(a);}
    vec4 ab(vec4 a, float b){return abs(a);}

    // FRACTIONAL PART
    vec4 frc(vec4 a){return fract(a);}
    float frc(float a){return fract(a);}
    vec4 frc(vec4 a, vec4 b){return fract(a);}
    float frc(float a, float b){return fract(a);}
    float frc(float a, vec4 b){return fract(a);}
    vec4 frc(vec4 a, float b){return fract(a);}

    // MODULO
    float md(float a, float b){return mod(a, b);}
    vec4 md(float a, vec4 b){return mod(vec4(a), b);}
    vec4 md(vec4 a, vec4 b){return mod(a, b);}
    vec4 md(vec4 a, float b){return mod(a, vec4(b));}
    vec4 md(vec4 a){return vec4(0.0);}
    float md(float a){return 0.0;}

    // MIN
    vec4 mn(vec4 a, vec4 b){return min(a,b);}
    float mn(float a, float b){return min(a,b);}
    vec4 mn(float a, vec4 b){return min(vec4(a), b);}
    vec4 mn(vec4 a, float b){return min(a, vec4(b));}
    vec4 mn(vec4 a){return a;}
    float mn(float a){return a;}

    // MAX
    vec4 mx(vec4 a, vec4 b){return max(a,b);}
    float mx(float a, float b){return max(a,b);}
    vec4 mx(float a, vec4 b){return max(vec4(a), b);}
    vec4 mx(vec4 a, float b){return max(a, vec4(b));}
    vec4 mx(vec4 a){return a;}
    float mx(float a){return a;}

    //// DOT PRODUCT
    float dt(float a, vec4 b){return dot(vec4(a), b);}
    float dt(vec4 a, float b){return dot(a, vec4(b));}
    float dt(vec4 a){return a.x + a.y + a.z + a.w;}
    float dt(float a){return a;}

    // DISTANCE
    float dst(vec4 a, vec4 b){return distance(a,b);}
    float dst(float a, float b){return distance(a,b);}
    float dst(float a, vec4 b){return distance(vec4(a), b);}
    float dst(vec4 a, float b){return distance(a, vec4(b));}
    float dst(vec4 a){return length(a);}
    float dst(float a){return 0.0;}

    // NORMALIZE
    vec4 nrm(vec4 a){return normalize(a);}
    float nrm(float a){return normalize(a);}
    vec4 nrm(vec4 a, vec4 b){return normalize(a);}
    float nrm(float a, float b){return normalize(a);}
    float nrm(float a, vec4 b){return normalize(a);}
    vec4 nrm(vec4 a, float b){return normalize(a);}

    // SINE
    vec4 sn(vec4 a, vec4 b){return sin(a);}
    float sn(float a, float b){return sin(a);}
    float sn(float a, vec4 b){return sin(a);}
    vec4 sn(vec4 a, float b){return sin(a);}

    // COSINE
    vec4 cs(vec4 a, vec4 b){return cos(a);}
    float cs(float a, float b){return cos(a);}
    float cs(float a, vec4 b){return cos(a);}
    vec4 cs(vec4 a, float b){return sin(a);}

    // TANGENT
    vec4 tn(vec4 a, vec4 b){return tan(a);}
    float tn(float a, float b){return tan(a);}
    float tn(float a, vec4 b){return tan(a);}
    vec4 tn(vec4 a, float b){return tan(a);}

    // ARC SINE
    vec4 asn(vec4 a, vec4 b){return asin(a);}
    float asn(float a, float b){return asin(a);}
    float asn(float a, vec4 b){return asin(a);}
    vec4 asn(vec4 a, float b){return asin(a);}

    // ARC COSINE
    vec4 acs(vec4 a, vec4 b){return acos(a);}
    float acs(float a, float b){return acos(a);}
    float acs(float a, vec4 b){return acos(a);}
    vec4 acs(vec4 a, float b){return acos(a);}

    // ARC TANGENT
    vec4 atn(vec4 a, vec4 b){return atan(a);}
    float atn(float a, float b){return atan(a);}
    float atn(float a, vec4 b){return atan(a);}
    vec4 atn(vec4 a, float b){return atan(a);}

    vec4 vec( float a){return vec4(a);}
    vec4 vec( float a, float b){return vec4(a, a, a, b);}
    vec4 vec( float a, float b, float c){return vec4(a, b, c, 1.0);}
    vec4 vec( float a, float b, float c, float d){return vec4(a, b, c, d);}

    // RETURN A PSEUDO RANDOM NUMBER [0.0 - 1.0]
    float random() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec2 st = uv * vec2(randSeed, -randSeed * 51345.01432341);
      float res = fract(sin(dot(st.xy,vec2(12.9898,78.233))) * 43758.5453123);
      return res;
    }

    // GET A NEIGHBOUR RELATIVE TO SELF
    vec4 val(float _x, float _y){
      return texture2D(backbuffer, (gl_FragCoord.xy / resolution.xy) + ( (1.0/resolution.xy) * vec2(_x, _y)));
    }


    `

    res += `
    void main()
    {
        // VARS
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 pixel = 1.0/resolution;
        bool useMouse = true;
        bool useAlpha = false;
        float aspect = resolution.x/resolution.y;

        // global variables
        vec4 mouseColor = vec4(1.0);
        float mouseRadius = 1.0;
        vec4 config = vec(0.0, 0.0, 0.0, 1.0);

        vec4 V = val(0.,0.);
        vec4 V2 = val(0., 1.) + val(0.,-1.);
        vec4 V3 = val(-1., -1.) + val(0., -1.) + val(1., -1.);
        vec4 V4 = val(0., -1.) + val(0.,1.) + val(-1., 0.) + val(1.,0.);
        vec4 V5 = V + V4;
        vec4 V6 = val(-1., -1.) + val( 0., -1.) + val( 1., -1.) + val(-1., 1.) + val( 0., 1.) + val( 1., 1.);
        vec4 V7 = V + V6;
        vec4 V8 = V4 + val(-1., -1.) + val( 1., -1.) + val(-1., 1.) + val( 1., 1.);
        vec4 V9 = V + V8;
        vec4 V10 = V8 + val(0., -2.) + val(0., 2.);
        vec4 V11 = V10 + V;
        vec4 V12 = V10 + val(-2., 0.) + val(2., 0.);
        vec4 V13 = V12 + V;
        vec4 V14 = V12 + val(0., -3.) + val(0., 3.);
        vec4 V15 = V14 + V;
        vec4 V16 = V14 + val(-3., 0.) + val(3., 0.);
        vec4 V17 = V16 + V;
    `

    return res;

    }

  function getUtoFragB(){

    var res = `
    if(useMouse == true){
      float mousePos = length(mouse.xy *resolution - gl_FragCoord.xy);
      float t = clamp(mousePos - mouseRadius, 0.0, 1.0);
      vec4 layer2 = vec4(mouseColor.rgb, 1.0 - t);
      V = mix(V, layer2, layer2.a * float(mouseDown));
    }

    if(useAlpha == false){
      V.a = 1.0;
    }

    if(doConfig == 1){
      V = config;
    }

    V = clamp(V, 0.0, 1.0);

    gl_FragColor = vec4(V.rgb, 1.0);
    }
    `
    return res;
  }


  function getVertexShader(){
    var res = `
    attribute vec3 position;
    void main() {
        gl_Position = vec4( position, 1.0 );
    }
    `
    return res;
  }

  function getFragmentShader(){
    var res = `
    #ifdef GL_ES
    precision highp float;
    #endif
    uniform vec2 resolution;
    uniform sampler2D texture;
    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        gl_FragColor = texture2D( texture, uv );
    }
    `

    return res;
  }


  return this;
}// end utomata()
