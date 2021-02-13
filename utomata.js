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
- toroidal bounds
- implement better incapsulation
- allow input-output between two instances of utomata
- function versions that handle vec2, vec3 types as well
- create a minified version
- config and input are a bt confused:
  - the input fragment should be available via the I vec4.
  - it can be run over in the program (or if no image was given)
  - using config = I;
- add step uniform
- How about adding a T(d) function that returns the sum of neighbours within d distance from uv ?


BUGS:
- REPEAT doesn't work
*/

function utomata(_wid, _hei, _canvasId)
{

  var _this = this;
  // all structure parameters
  var params = {
    width: _wid,
    height: _hei,
    transition: "V = vec4(0.0, 0.0, 0.0, 1.0);",
    config: "vec4(0.0, 0.0, 0.0, 1.0)",
    doConfig: 1,
    edge: "REPEAT",
    fps: 60,
    zoom: 1,
    step: 0,
    elapsedTime: 0,
    startTime: Date.now(),
    mouseDown: 0,
    mouseOver: 0,
    mouseX: 0,
    mouseY: 0,
    pMouseX: 0,
    pMouseY: 0,
    randSeed: 123.01234,
    useCastInt: true,
    input: undefined,
    useInput: false,
    avgFps: 60,
    stepLimit: -1,
    completionCallback: undefined
  }

  // an array of key value pairs to use as uniforms for the shader
  var uniforms = {};

  // GL vars
  var canvas, gl, buffer, currentProgram, vertexPosition;
  var frontTarget, backTarget, screenProgram;

  var errors = [];
  var stepCounter = undefined;
  var infoText = undefined;
  var running = true;
  var fpsInterval = 1000/params.fps;

  // animation vars (TODO: remove?)
  var then = Date.now();
  var startTime = then;
  var now, elapsed;

  var isInitialized = false;
  var parentDiv = undefined;

  var canvasId = "mainCanvas";
  if(_canvasId !== undefined){
    canvasId = _canvasId;
  }



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


  // PUBLIC METHODS

  this.run = function(_transition){

    if(_transition !== undefined){
      params.transition = processPgm(_transition);
    }

    params.startTime =  Date.now();
    running = true;

    compile();
  }


  this.stop = function(_transition){
    running = false;
  }

  // SETTERS
  this.config = function(_conf){

    if(_conf !== undefined){
      params.config = _conf;
    }

    if(params.useInput){
      setTargetsToImage();
    }else{
      params.doConfig = 1;
    }
    params.step = 0;
  }

  this.setup = function(_setup){
    params.config = _setup;
  }

  this.update = function(_update){
    params.transition = _update;
  }

  this.fps = function(_fps){
    params.fps = _fps;
    fpsInterval = 1000/params.fps;
  }

  this.setUniform = function(k, v){
    uniforms[k] = v;
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

  this.width = function(w){
    params.width = parseInt(w);
    updateCanvasSize();
  }

  this.height = function(h){
    params.height = parseInt(h);
    updateCanvasSize();
  }

  this.size = function(w, h){
    params.width = parseInt(w);
    params.height =parseInt(h);
    updateCanvasSize();
  }

  this.input = function(img){
    if(img instanceof HTMLImageElement){
      loadImage(img);
      params.useInput = true;
    }else{
      // anything else - just don't use it.
      params.useInput = false;
    }
  }

  this.zoom = function(mag){
    params.zoom = Math.max( 0.01 , mag);
    params.zoom = Math.min(128, params.zoom);
    zoomCanvas();
  }

  this.seed = function(s){
    params.randSeed = s;
  }

  // GETTERS
  this.getStatus = function(){
    if(running){
      return "running, current step: " + params.step;
    }else{
      return "paused, current step: " + params.step;
    }
  }

  this.getVars = function(){
    return uniforms[k];
  }
  this.getFps = function(){
    return params.avgFps;
  }
  this.errors = function(){
    return errors;
  }
  this.getMouseX = function(){
    return params.mouseX;
  }
  this.getMouseY = function(){
    return params.mouseY;
  }
  this.getWidth = function(){
    return params.width;
  }
  this.getHeight = function(){
    return params.height;
  }
  this.getParams = function(){
    return params;
  }

  this.getTransition = function(){
    return params.transition;
  }

  this.setParent = function(parent){
    parentDiv = parent;
    parentDiv.appendChild(canvas);
  }

  this.step = function(){
    render();
  }

  this.setCanvasId = function(id){
    canvasId = id;
  }
  this.getCanvasId = function(){
    return canvasId;
  }

  this.setExternalStepCounter = function(elem){
    stepCounter = elem;
  };

  this.setExternalInfoText = function(elem){
    infoText = elem;
  };

  this.setStepLimit = function(_step, _callback = null){

    if(_step < 1){
        params.stepLimit = _step;
    }else{
        params.stepLimit = _step;
    }
    if(_callback !== null){

      params.completionCallback = _callback;
    }
  }

  // PRIVATE METHODS



  function init() {

    // create #mainCanvas
  	// var container = document.createElement( 'div' );
    // container.id = "mainCanvasContainer"
  	// document.body.appendChild( container );

  	canvas = document.createElement( 'canvas' );
    canvas.id = canvasId;
    canvas.style.setProperty("image-rendering", "pixelated");
    canvas.style.setProperty("image-rendering", "-moz-crisp-edges");
    canvas.style.setProperty("image-rendering", "crisp-edges");
    canvas.style.setProperty("cursor", "crosshair");

    if(parentDiv == undefined){
        document.body.appendChild( canvas );
    }else{
        parentDiv.appendChild( canvas );
    }



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
      var rect = canvas.getBoundingClientRect();
      var clientX = (event.clientX - rect.left) / params.zoom;
      var clientY = (event.clientY - rect.top) / params.zoom;

      params.mouseX = clientX / params.width;
      params.mouseY = ( (clientY) / (params.height) )  ;
    }, false );

    window.addEventListener( 'mouseup', function ( event ) {
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
      params.mouseY = ( (clientY) / (params.height) )  ;

    }, false );


    compile();
  	compileScreenProgram();

    isInitialized = true;
  }

  function decimal(n, d){
      var a = Math.pow(10,d);
      return Math.round(n * a) / a;
  }


  function compile() {

    //console.log("compiling: " + params.transition);

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
    cacheUniformLocation( program, 'pmouse' );
    cacheUniformLocation( program, 'mouseDown' );
    cacheUniformLocation( program, 'resolution' );
    cacheUniformLocation( program, 'backbuffer' );
    cacheUniformLocation( program, 'doConfig' );
    cacheUniformLocation( program, 'randSeed' );

    for(var i = 0 ; i < Object.keys(uniforms).length; i++){
      cacheUniformLocation( program, Object.keys(uniforms)[i] );

    }
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
  function loadImage(img) {

    params.input = img;
    params.input.onload = function() {

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
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, params.input );

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
  }

  function isPowTwoSize(){
    var res = (((params.width & (params.width - 1)) == 0) && ((params.width & (params.width - 1)) == 0));
    return res;
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

    //console.error(errors);

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
    params.doConfig = 1;
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
      var actualFPS = decimal(1/(elapsed/1000),0);
      //params.avgFps += decimal((actualFPS - params.avgFps) / 10 ,0);
      params.avgFps = actualFPS;

      render();

      if(params.stepLimit != -1 && params.step > params.stepLimit){
        running = false;
        if(params.completionCallback){
          params.completionCallback();
        }
      }
    }

    params.pMouseX = params.mouseX;
    params.pMouseY = params.mouseY;
  }

  function render() {

    if ( !currentProgram ) return;

    params.elapsedTime = Date.now() - params.startTime;
    params.randSeed = Math.random();
    // Set uniforms for custom shader

    gl.useProgram( currentProgram );

    gl.uniform1f( currentProgram.uniformsCache[ 'time' ], params.step );
    gl.uniform2f( currentProgram.uniformsCache[ 'mouse' ], params.mouseX, params.mouseY );
    gl.uniform2f( currentProgram.uniformsCache[ 'pmouse' ], params.pMouseX, params.pMouseY );
    gl.uniform2f( currentProgram.uniformsCache[ 'resolution' ], params.width, params.height );
    gl.uniform1i( currentProgram.uniformsCache[ 'backbuffer' ], 0 );
    gl.uniform1f( currentProgram.uniformsCache[ 'doConfig' ], params.doConfig );
    gl.uniform1i( currentProgram.uniformsCache[ 'mouseDown' ], params.mouseDown );
    gl.uniform1f( currentProgram.uniformsCache[ 'randSeed' ], params.randSeed );
    //gl.uniform1f( currentProgram.uniformsCache[ 'timeStep' ], params.step );

    for(var i = 0 ; i < Object.keys(uniforms).length; i++){
      gl.uniform1f( currentProgram.uniformsCache[ Object.keys(uniforms)[i] ], uniforms[Object.keys(uniforms)[i]] );
    }

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

    if(stepCounter !== undefined){
      stepCounter.innerHTML = params.step;
    }
    if(infoText !== undefined){
      if(running){
        var x = Math.round(params.mouseX * 10000)/10000 ;
        var y = Math.round(params.mouseY * 10000)/10000 ;
        infoText.innerHTML = "Running at: " + params.avgFps+ " fps | mouse: ("+ x +", "+y  +")";
      }else{
        infoText.innerHTML = "Paused";
      }

    }

    params.step += 1;
  }

  function htmlEncode(str){

    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  }

  function processPgm(pgm){
    pgm = pgm.replace(/max\s*\(/g, "mx(");
    pgm = pgm.replace(/min\s*\(/g, "mn(");
    pgm = pgm.replace(/mod\s*\(/g, "md(");
    pgm = pgm.replace(/log\s*\(/g, "lg(");
    pgm = pgm.replace(/pow\s*\(/g, "pw(");
    pgm = pgm.replace(/dot\s*\(/g, "dt(");
    pgm = pgm.replace(/sin\s*\(/g, "sn(");
    pgm = pgm.replace(/cos\s*\(/g, "cs(");
    pgm = pgm.replace(/tan\s*\(/g, "tn(");



    if(params.useCastInt){
      //var integerRegex = new RegExp( /(\b(?<![.])[0-9]+(?![.])\b)/g ); // not working on safari
      //var integerRegex = new RegExp( /^[-+]?\d+$/gm);
      var integerRegex = new RegExp( /(^|\s|\(|\)|\,|\;)([0-9]+)(\s|\(|\)|\,|\;|$)/gm);
      // var testRegex = /(\,|^|\s|\()(\d+)(\s|\,|\)|$)/g ; // use with $2.0
      pgm = pgm.replace(integerRegex, '$1$2.0$3');

    }
    // console.log("program: " + pgm);


    var updateRegex = new RegExp( /update\s*=/ );

    if(pgm.search(updateRegex) == -1){
      pgm = "update=" + pgm;
    }

    return pgm;
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
    uniform vec2 pmouse;
    uniform vec2 resolution;
    uniform sampler2D backbuffer;

    uniform float doConfig;
    uniform int mouseDown;
    uniform float randSeed;
    `;

    for(var i = 0 ; i < Object.keys(uniforms).length; i++){
      res += "uniform float " + Object.keys(uniforms)[i] +";\n"
    }

    res +=`

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
    float sub(float a, float b){return a - b;}
    vec2 sub(vec2 a, vec2 b){return a - b;}
    vec3 sub(vec3 a, vec3 b){return a - b;}
    vec4 sub(vec4 a, vec4 b){return a - b;}
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
    float pw(float a, float b){return pow(a, b);}
    vec2 pw(vec2 a, vec2 b){return pow(a, b);}
    vec2 pw(vec2 a, float b){return pow(a, vec2(b));}
    vec3 pw(vec3 a, vec3 b){return pow(a, b);}
    vec4 pw(vec4 a, vec4 b){return pow(a, b);}
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
    vec2 md(vec2 a, vec2 b){return mod(a, b);}
    vec2 md(vec2 a, float b){return mod(a, b);}
    vec3 md(vec3 a, vec3 b){return mod(a, b);}
    vec3 md(vec3 a, float b){return mod(a, b);}
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
    vec2 mx(vec2 a, vec2 b){return max(a,b);}
    vec3 mx(vec3 a, vec3 b){return max(a,b);}
    vec4 mx(vec4 a, vec4 b){return max(a,b);}
    float mx(float a, float b){return max(a,b);}
    vec4 mx(float a, vec4 b){return max(vec4(a), b);}
    vec4 mx(vec4 a, float b){return max(a, vec4(b));}
    vec4 mx(vec4 a){return a;}
    float mx(float a){return a;}

    //// DOT PRODUCT
    float dt(float a, float b){return dot(a, b);}
    float dt(vec2 a, vec2 b){return dot(a, b);}
    float dt(vec3 a, vec3 b){return dot(a, b);}
    float dt(float a, vec4 b){return dot(vec4(a), b);}
    float dt(vec4 a, float b){return dot(a, vec4(b));}
    float dt(vec4 a){return a.x + a.y + a.z + a.w;}
    float dt(float a){return a;}

    // DISTANCE
    float dst(float a){return a;}
    float dst(vec2 a){return length(a);}
    float dst(vec3 a){return length(a);}
    float dst(vec4 a){return length(a);}
    float dst(vec2 a, vec2 b){return distance(a,b);}
    float dst(vec3 a, vec3 b){return distance(a,b);}
    float dst(vec4 a, vec4 b){return distance(a,b);}
    float dst(float a, float b){return distance(a,b);}
    float dst(float a, vec4 b){return distance(vec4(a), b);}
    float dst(vec4 a, float b){return distance(a, vec4(b));}


    // NORMALIZE
    vec4 nrm(vec4 a){return normalize(a);}
    float nrm(float a){return normalize(a);}
    vec4 nrm(vec4 a, vec4 b){return normalize(a);}
    float nrm(float a, float b){return normalize(a);}
    float nrm(float a, vec4 b){return normalize(a);}
    vec4 nrm(vec4 a, float b){return normalize(a);}

    // SINE
    float sn(float a){return sin(a);}
    vec2 sn(vec2 a){return sin(a);}
    vec3 sn(vec3 a){return sin(a);}
    vec4 sn(vec4 a){return sin(a);}
    float sn(float a, vec4 b){return sin(a);}
    vec4 sn(vec4 a, float b){return sin(a);}

    // COSINE
    float cs(float a){return cos(a);}
    vec2 cs(vec2 a){return cos(a);}
    vec3 cs(vec3 a){return cos(a);}
    vec4 cs(vec4 a){return cos(a);}
    float cs(float a, vec4 b){return cos(a);}
    vec4 cs(vec4 a, float b){return cos(a);}

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

    const float PHI = 1.61803398874989484820459; // Φ = Golden Ratio

    // RETURN A PSEUDO RANDOM NUMBER [0.0 - 1.0]
    float random(float _seed) {
      vec2 st = gl_FragCoord.xy / resolution.xy;
      return fract(sin(dot(st.xy, vec2(randSeed*12.9898,_seed*78.233)))* 43758.5453123);
    }
    // auto seed
    float random() {
      vec2 st = gl_FragCoord.xy / resolution.xy;
      return fract(sin(dot(st.xy, vec2(randSeed*12.9898,78.233)))* 43758.5453123);
    }
    // vec4
    vec4 random(float _seedA,float _seedB, float _seedC, float _seedD ) {
      return vec4(random(_seedA),random(_seedB),random(_seedC),random(_seedD));
    }
    // vec4 with alpha 1
    vec4 random(float _seedA,float _seedB, float _seedC ) {
      return vec4(random(_seedA),random(_seedB),random(_seedC),1.0);
    }

    // 2D Random
    float random_det(in vec2 st) {
        return fract(sin(dot(st.xy,
                             vec2(12.9898,78.233)))
                     * 43758.5453123);
    }

    // 2D Noise based on Morgan McGuire @morgan3d
    // https://www.shadertoy.com/view/4dS3Wd
    float noise(in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random_det(i);
        float b = random_det(i + vec2(1.0, 0.0));
        float c = random_det(i + vec2(0.0, 1.0));
        float d = random_det(i + vec2(1.0, 1.0));

        // Smooth Interpolation

        // Cubic Hermine Curve.  Same as SmoothStep()
        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }



    // GET A CELL VALUE (ABSOLUTE COORD)
    vec4 val(float _x, float _y){
      return texture2D( backbuffer, vec2(_x, _y) );
    }


    // GET A NEIGHBOUR RELATIVE TO SELF
    vec4 U(float _x){
      return texture2D(backbuffer, (gl_FragCoord.xy / resolution.xy) + ( (1.0/resolution.xy) * vec2(_x, 0.0)));
    }
    vec4 U(float _x, float _y){
      return texture2D(backbuffer, (gl_FragCoord.xy / resolution.xy) + ( (1.0/resolution.xy) * vec2(_x, _y)));
    }
    vec4 U(vec2 p){
      return texture2D(backbuffer, (gl_FragCoord.xy / resolution.xy) + ( (1.0/resolution.xy) * vec2(p.x, p.y)));
    }
    vec4 U(vec3 p){
      return texture2D(backbuffer, (gl_FragCoord.xy / resolution.xy) + ( (1.0/resolution.xy) * vec2(p.x, p.y)));
    }
    vec4 U(vec4 p){
      return texture2D(backbuffer, (gl_FragCoord.xy / resolution.xy) + ( (1.0/resolution.xy) * vec2(p.x, p.y)));
    }

    `

    res += `
    void main()
    {
        // VARS
        vec2  uv = gl_FragCoord.xy / resolution.xy;
        float aspectRatio = resolution.x/resolution.y;

        // new name conventions
        bool alpha = false;
        vec2 grid = vec2(resolution.x, resolution.y);
        vec4 cell = vec4( uv.x, uv.y, max(1.0/grid.x, 1.0/grid.y), max(1.0/grid.x, 1.0/grid.y) );

        vec4 cursor = vec4(mouse.x , mouse.y, pmouse.x, pmouse.y);
        vec4 pen = vec4(1.0);

        // neighbourhood shortcuts
        vec4 V =  U(0.,0.);
        vec4 V1 =  U(0.,-1.);
        vec4 V2 = U(0., 0.) + U(0.,-1.);
        vec4 V3 = U(-1., -1.) + U(0., -1.) + U(1., -1.);
        vec4 V4 = U(0., -1.) + U(0.,1.) + U(-1., 0.) + U(1.,0.);
        vec4 V5 = V + V4;
        vec4 V6 = V3 + U(-1., 1.) + U( 0., 1.) + U( 1., 1.);
        vec4 V7 = V + V6;
        vec4 V8 = V4 + U(-1., -1.) + U( 1., -1.) + U(-1., 1.) + U( 1., 1.);
        vec4 V9 = V + V8;

        vec4  setup = `+ params.config+`;
        vec4 update = V;
    `

    return res;

    }

  function getUtoFragB(){

    var res = `
    ;
    float mouseDist = distance(cursor.xy * grid.xy , gl_FragCoord.xy);
    if (mouseDown == 1 && mouseDist <= (pen.w) + 0.5) {
      update = pen;
    }
    if(alpha == false){
      update.a = 1.0;
    }
    update = (doConfig * setup) + ((1.0-doConfig) * update);
    update = clamp(update, 0.0, 1.0);
    gl_FragColor = update;
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
        uv.y = 1.0 - uv.y;
        gl_FragColor = texture2D( texture, uv );
    }
    `

    return res;
  }

  return this;
}// end utomata()
