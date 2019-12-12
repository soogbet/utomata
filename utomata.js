////////////////////////////////////
// UTOMATA JS
//////////////////////////////////
/*
  A javascript library for Cellular Automata
  liorbengai 2019
  labofbabel.org
*/

/*

BUG: the initial width and height cannot be overriden upwards

*/

function Utomata(canvasID)
{

  /////////////////////////////////////////////////
  // GLOBAL PARAMS
  var _this = this;

  var isSet = false;
  var running = false;
  var step = 0;

  var lastPgm;
  var currentProgram;
  var errorStack = [];

  var fps, fpsInterval, now, then, elapsed, actualFPS, avgFps = 0;

  var gl, buffer, vertexPosition;
  var frontTarget, backTarget, screenProgram, startFrag, fragVars;

  var hasInputImage = false;
  var inputImage;

  var isPowerOfTwoCanvas = false;

  var animationFrameIndex;
  var updateEvent = new Event("update");

  var params = {
    edgeType: 0,
    width: 512,
    height: 512,
    startTime: Date.now(),
    time: 0,
    mouseX: 0,
    mouseY: 0,
    mouseDown: 0,
    mouseOver: 0,
    mouseRadius: 1.0,
    mouseColor:{r:1.0, g:1.0, b:1.0, a:1.0},
    doConfig: 0,
    configRule: "vec4(0.0)"
  }

  /////////////////////////////////////////////////
  // CANVAS

  var canvas = document.getElementById( canvasID );

  canvas.addEventListener( 'mousedown', function ( event ) {
    params.mouseDown = 1;
  }, false );

  canvas.addEventListener( 'mouseup', function ( event ) {
    params.mouseDown = 0;
  }, false );

  canvas.addEventListener( 'mouseover', function ( event ) {
    params.mouseOver = 1;
  }, false );

  canvas.addEventListener( 'mouseout', function ( event ) {
    params.mouseOver = 0;
  }, false );

  canvas.addEventListener( 'mousemove', function ( event ) {

    var rect = canvas.getBoundingClientRect();

    var ratioW = parseInt(canvas.style.width, 10) / canvas.width;
    var ratioH = parseInt(canvas.style.height, 10) / canvas.height;

    var clientX = (event.clientX - rect.left) / ratioW;
    var clientY = (event.clientY - rect.top) / ratioH;

    params.mouseX = clientX / canvas.width;
    params.mouseY = 1- ( (clientY) / (canvas.height) )  ;

  }, false );

  /////////////////////////////////////////////////
  // INIT

  this.setup = function(wid, hei, configRule){

    if(wid === undefined || hei === undefined){
      // ?
    }else{
      params.width = wid;
      params.height = hei;

      // make sure there is an initial css value
      canvas.style.width = params.width + 'px';
      canvas.style.height = params.height + 'px';
    }

    if(configRule === undefined){
      params.doConfig = 0;
      params.configRule = "vec4(0.0)";
    }else{
      params.doConfig = 1;
      params.configRule = configRule;
    }

    canvas.width = params.width;
    canvas.height = params.height;

    isPowerOfTwoCanvas = isPowerOfTwo(canvas.width) && isPowerOfTwo(canvas.height);

    // Initialise WebGL
    try {
      gl = canvas.getContext( 'experimental-webgl', {preserveDrawingBuffer: true} );
    } catch( error ) { }

    if ( !gl ) {
      alert("Sorry, Utomata need a WebGL enabled browser. Please use Chrome/Safari/Firefox");
      throw "cannot create webgl context";
    }

    // Create vertex buffer (2 triangles)
    buffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [ - 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0 ] ), gl.STATIC_DRAW );

    if (params.edgeType == 0) {
      params.edgeType = gl.CLAMP_TO_EDGE;
    }

    step = 0;
    fps = 60;
    fpsInterval = 1000 / fps;
    then = Date.now();
    params.startTime = then;


    gl.viewport( 0, 0, canvas.width, canvas.height );

    this.createRenderTargets();
    this.compileScreenProgram();

    isSet = true;
  }


  // RUN
  this.run = function(pgm){

    if(!isSet)this.setup();

    if(pgm === undefined){
      pgm = lastPgm;
    }else{
      if(lastPgm != pgm){
        this.compile(pgm);
        lastPgm = pgm;
      }
    }

    running = true;
    this.animate();
  }

  // pause
  this.stop = function(){
    running = false;
    this.dispatchEvent(updateEvent);
  }



  //////////////////////////////////////////////////////////////////
  // SETTERS

  this.setEdgeType = function(type){
    if(type == "REPEAT" && isPowerOfTwoCanvas){
      params.edgeType = gl.REPEAT;
    }else{
      params.edgeType = gl.CLAMP_TO_EDGE;
    }
  }

  this.setFps = function(_fps){
    fps = _fps;
    fpsInterval = 1000.0 / fps;
  }

  this.setMouseColor = function(hex){
    params.mouseColor = hexToRgb(hex);
  }

  this.setMouseRadius = function( rad){
    params.mouseRadius = rad;
  }

  // set Input image with url
  this.setInput = function(url) {
    inputImage = new Image();
    inputImage.crossOrigin = "";
    inputImage.src = url;

    inputImage.onload = function() {
      _this.setup(this.width, this.height );
      _this.setTargetsToImage();
      step = 0;
    };
  }


  //////////////////////////////////////////////////////////////////
  // GETTERS

  this.getInfo = function(){
    var res = "";
    res += " ( " + params.width + " by " + params.height + " ) | ";
    if(running){
      res += "Running at " + avgFps + " fps | "
    }else{
      res += "Paused | "
    }
    res += "step: "+step+" | "
    if(running){
      res += "mouse: ("+ decimal(params.mouseX, 4) +", " + decimal(params.mouseY, 4) +")";
    }

    return res;
  }

  this.getErrors = function(){
      if(errorStack.length == 0){
        return "";
      }
      // return just the first one
      return errorStack[0];
  }

  this.getWidth = function(){
    return params.width;
  }

  this.getHeight = function(){
    return params.height;
  }

  this.getEdgeType = function(){
    return params.edgeType;
  }

  this.getMouseX = function(){
    return params.mouseX;
  }

  this.getMouseY = function(){
    return params.mouseY;
  }

  this.getIsPowTwo = function(){
    return isPowerOfTwo;
  }



  //////////////////////////////////////////////////////////////////
  // RENDERING


  this.animate = function(){
    animationFrameIndex = requestAnimationFrame( _this.animate );
    if(running){

      now = Date.now();
      elapsed = now - then;

      if(elapsed > fpsInterval){
        then = now - (elapsed % fpsInterval);
        actualFPS = decimal(1/(elapsed/1000),0);
        avgFps += decimal((actualFPS - avgFps) / 10 ,0);

        dispatchEvent(updateEvent);
        _this.render();
      }
    }
  }


  this.compile = function(pgm) {

    var program = gl.createProgram();
    var vertex = this.getUtomataVertShader();
    var fragment =  this.getUtomataFragStart() + pgm + this.getUtomataFragEnd();

    var vs = this.createShader( vertex, gl.VERTEX_SHADER );
    var fs = this.createShader( fragment, gl.FRAGMENT_SHADER );

    if ( vs == null || fs == null ) return null;

    gl.attachShader( program, vs );
    gl.attachShader( program, fs );

    gl.deleteShader( vs );
    gl.deleteShader( fs );

    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
      return;
    }

    errorStack = [];

    currentProgram = program;

    // Cache uniforms
    this.cacheUniformLocation( program, 'time' );
    this.cacheUniformLocation( program, 'mouse' );
    this.cacheUniformLocation( program, 'mouseDown' );
    this.cacheUniformLocation( program, 'doConfig' );
    this.cacheUniformLocation( program, 'centerPoint' );
    this.cacheUniformLocation( program, 'mouseRadius' );
    this.cacheUniformLocation( program, 'mouseColor' );
    this.cacheUniformLocation( program, 'resolution' );
    this.cacheUniformLocation( program, 'backbuffer' );
    this.cacheUniformLocation( program, 'slider' );

    // Load program into GPU
    gl.useProgram( program );

    // Set up buffers
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
    gl.vertexAttribPointer( vertexPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

  }

  this.render = function() {

    if ( !currentProgram ) return;

    if(step > 0){
        params.doConfig = 0;
    }

    params.time = Date.now() - params.startTime;
    // Set uniforms for custom shader
    gl.useProgram( currentProgram );
    gl.uniform1f( currentProgram.uniformsCache[ 'time' ], params.time / 1000 );
    gl.uniform2f( currentProgram.uniformsCache[ 'mouse' ], params.mouseX, params.mouseY );
    gl.uniform2f( currentProgram.uniformsCache[ 'resolution' ], params.width, params.height );
    gl.uniform1i( currentProgram.uniformsCache[ 'backbuffer' ], 0 );
    gl.uniform1i( currentProgram.uniformsCache[ 'mouseDown' ], params.mouseDown );
    gl.uniform1i( currentProgram.uniformsCache[ 'doConfig' ], params.doConfig );
    gl.uniform1i( currentProgram.uniformsCache[ 'centerPoint' ], params.centerPoint );
    gl.uniform1f( currentProgram.uniformsCache[ 'mouseRadius' ], params.mouseRadius );
    gl.uniform4f( currentProgram.uniformsCache[ 'mouseColor' ], params.mouseColor.r, params.mouseColor.g, params.mouseColor.b, params.mouseColor.a );

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
    step++;
  }


  this.compileScreenProgram = function() {

    var program = gl.createProgram();
    var fragment = `
    precision highp int;
    precision highp float;

    uniform vec2 resolution;
    uniform sampler2D texture;
    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        gl_FragColor = texture2D( texture, uv );
    }
    `;
    var vertex = `
    precision highp int;
    precision highp float;

    attribute vec3 position;

    void main()
    {
        gl_Position = vec4( position.x, position.y,0.0, 0.0 );

    }
    `;

    var vs = this.createShader( vertex, gl.VERTEX_SHADER );
    var fs = this.createShader( fragment, gl.FRAGMENT_SHADER );

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

    this.cacheUniformLocation( program, 'resolution' );
    this.cacheUniformLocation( program, 'texture' );

  }


  this.cacheUniformLocation = function( program, label ) {

    if ( program.uniformsCache === undefined ) {
      program.uniformsCache = {};
    }
    program.uniformsCache[ label ] = gl.getUniformLocation( program, label );
  }


  this.createRenderTargets = function() {
    frontTarget = this.createBackTarget(params.width, params.height );
    backTarget = this.createBackTarget(params.width, params.height );
  }

  this.createBackTarget = function(width, height ) {

    var target = {};
    target.framebuffer = gl.createFramebuffer();
    target.renderbuffer = gl.createRenderbuffer();
    target.texture = gl.createTexture();

    gl.bindTexture( gl.TEXTURE_2D, target.texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, params.edgeType  );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, params.edgeType  );

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


  this.setTargetsToImage = function(){
      if(inputImage == null || inputImage == undefined){
        return;
      }
      var target = {};
      target.framebuffer = gl.createFramebuffer();
      target.renderbuffer = gl.createRenderbuffer();
      target.texture = gl.createTexture();

      gl.viewport( 0, 0, canvas.width, canvas.height );

      // set up framebuffer
      gl.bindTexture( gl.TEXTURE_2D, target.texture );
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inputImage );

      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );

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
      frontTarget = this.createBackTarget(params.width, params.height );
      hasInputImage = true;
  }

  this.createShader = function( src, type ) {

    var shader = gl.createShader( type );

    var line, lineNum, lineError, index = 0, indexEnd;
    var linesInETCfrag = this.getUtomataFragStart().split('\n').length - 1 ;

    gl.shaderSource( shader, src );
    gl.compileShader( shader );

    if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {

      var error = gl.getShaderInfoLog( shader );

      // Remove trailing linefeed, for FireFox's benefit.
      while ((error.length > 1) && (error.charCodeAt(error.length - 1) < 32)) {
        error = error.substring(0, error.length - 1);
      }

      errorStack = [];

      while (index >= 0) {
        index = error.indexOf("ERROR: 0:", index);
        if (index < 0) { break; }
        index += 9;
        indexEnd = error.indexOf(':', index);
        if (indexEnd > index) {
          lineNum = parseInt(error.substring(index, indexEnd)) - linesInETCfrag;
          if ((!isNaN(lineNum)) && (lineNum > 0)) {
            index = indexEnd + 1;
            indexEnd = error.indexOf("ERROR: 0:", index);
            lineError = htmlEncode((indexEnd > index) ? error.substring(index, indexEnd) : error.substring(index));
            errorStack.push("ERROR in Line " +lineNum+" >> "+ lineError);
          }
        }
      }


      // Has errors
      return null;

    }else{
      // no errors
      // nothing to do
    }

    return shader;

  }

  // HTML ENCODER HELPER THINGY
  function htmlEncode(str){
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // GET FLOAT DECIMAL
  function decimal(n, d){
      var a = Math.pow(10,d);
      return Math.round(n * a) / a;
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16)/255,
      g: parseInt(result[2], 16)/255,
      b: parseInt(result[3], 16)/255,
      a: 1.0
    } : null;
  }

  function isPowerOfTwo(x){
    while (((x % 2) == 0) && x > 1){
      x /= 2;
    } /* While x is even and > 1 */
    return (x == 1);
  }


  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // SHADERS

  this.getUtomataVertShader = function(){
    var res = `precision highp int;
      precision highp float;

      attribute vec3 position;

      void main()
      {
          gl_Position = vec4( position.x, position.y,0.0, 0.0 );

      }`;

    return res;
  }


  // fragment shaders for start and end of transition functions
  this.getUtomataFragStart = function(){

    let res = `
    //////////////////////////////////////////
    //
    // ETCETERA
    //
    //////////////////////////////////////////

    #define PI 3.14159265358979323846
    #define E 2.71828182845904523536
    #define G 1.61803398874989484820
    #define SQ2 1.41421356237309504880

    precision highp int;
    precision highp float;

    uniform float time;
    uniform vec2 mouse;
    uniform vec2 resolution;
    uniform sampler2D backbuffer;
    uniform int mouseDown;
    uniform int doConfig;
    uniform int centerPoint;
    uniform float slider;
    uniform float mouseRadius;
    uniform vec4 mouseColor;

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
    vec4 eql(vec4 a, vec4 b){return step(a,b) * step(b,a);}
    float eql(float a, float b){return step(a,b) * step(b,a);}
    vec4 eql(vec4 a, float b){return step(a,vec4(b)) * step(vec4(b),a);}
    vec4 eql(float a, vec4 b){return step(vec4(a),b) * step(b,vec4(a));}
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



    float random() {

      vec2 st = (gl_FragCoord.xy) / resolution.xy;
      return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
      
    }


    vec4 val(float _x, float _y){
      return texture2D(backbuffer, (gl_FragCoord.xy / resolution.xy) + ( (1.0/resolution) * vec2(_x, _y)));
    }

    //////////////////////////////////////////////////////////////////////
    void main()
      {

        vec2 coord = (gl_FragCoord.xy) / resolution.xy;
        vec2 pixel = 1.0/resolution;
        float ratio = resolution.x/resolution.y;
        bool useMouse = true;
        bool useAlpha = false;

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

        // vec4 T4 = NN[0] + NN[1] + NN[2] + NN[3];
        // vec4 T8 = NN[0] + NN[1] + NN[2] + NN[3] + NN[4] + NN[5] + NN[6] + NN[7];
        // vec4 T12 = T8 + NN[8] + NN[9] + NN[10] + NN[11];
        // vec4 T20 = T12 + NN[12] + NN[13] + NN[14] + NN[15] + NN[16] + NN[17] + NN[18] + NN[19];
        // vec4 T24 = T20 + NN[20] + NN[21] + NN[22] + NN[23];
        // my new experimental neighbourhood:
        //vec4 VB = V4 + (V8-V4)*0.5 + (V12-V8)*0.25 + (V20-V12)*0.125;

        //////////////////////////////////////////

    `;
    return res;
  }

  this.getUtomataFragEnd = function(){

    let res = `

        //////////////////////////////////////////

        if(useMouse){
          float mouseDist = distance(mouse.xy * resolution, gl_FragCoord.xy);
          if (mouseDown == 1 && mouseDist <= mouseRadius + 0.5) {
            V = mouseColor;
          }
        }

        if(!useAlpha){
            V.a = 1.0;
        }

        if(doConfig == 1){
          V = ` + params.configRule + `;
        }

        gl_FragColor = V;
      }
    `;

    return res;
  }


  return this;
}
