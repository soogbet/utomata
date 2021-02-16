
# UTOMATA
<i>utomata</i> is a Javascript/webGL framework for interactive, browser based [Cellular Automata](https://en.wikipedia.org/wiki/Cellular_automaton) experiments. It is designed for exploration of emergent virtual structures in computational art and design, modelling, simulation and procedural content generation.

<!-- Examples collection on codepen -->
<!-- other links ? -->
<!-- a touchdesigner COMP implementation -->
[utomata.net](https://utomata.net)

### Table of Contents

1. #### [Basic Usage](#basic)
1. #### [Introduction](#intro)
1. #### [Programming Guide](#guide)
    * [Creating an HTML page](#create)
    * [Instantiating Utomata](#instance)
    * [Applying a transition function](#trans)
    * [Accessing Neighbours](#neighbour)
    * [Applying a configuration](#conig)
1. #### [Case studies](#examples)
    * [Elementary Automata](#elementary)
    * [Game of Life](#GOL)
    * [Abelian Sandpile](#sandpile)
    * [Reaction Diffusion](#RD)
1. #### [API](#api)
    * [Methods](#methods)
    * [Getters](#getters)
1. #### [Language Reference](#ref)
    * [Data types](#types)
    * [Variables](#vars)
    * [Unary Operators](#unary)
    * [Binary Operators](#binary)
    * [Misc](#misc)

## Basic usage <a name="basic"></a>

```html
<!DOCTYPE html>
<html>
   <body></body>
   <script src="utomata.js"></script>
   <script>
      // create a system
      var uto = new  utomata(512, 512);
      // configure to random binary: 10% white
      uto.setup("vec( stp(random(), 0.1))");
      // run Conway's game of life
      uto.run("add(eql(3, V9), mlt(eql(4, V9), V))");
   </script>
</html>
```

# Introduction <a name="intro"></a>

[Cellular Automata](https://en.wikipedia.org/wiki/Cellular_automaton) (CA) is a family of algorithms featuring discrete entities (cells) that continuously interact with one another. Typically, they are organised in a fixed, two dimensional, regular grid. At regular intervals, all cells simultaneously transition from their current state to a new state, while consulting the states of their neighbours. This is called the *transition function*. Cell state may take any form, however, numerical data is most commonly used. As each cell in the system performs this transition, it both affects and is affected by its neighbours over time, causing a feedback loop from which complex, higher-order structures may emerge.
There are countless possible transition functions, almost all of which quickly drive the system towards either a uniform, static global state or to utter noise. However, there are also (countless still) functions that result in the emergence of coherent structures that posses interesting,  beautiful and potentially even useful patterns of behaviour. Many of which have already been discovered in the 70+ years of CA research. Most will never be.

Utomata is framework for exploration of CA algorithms. It is designated for trans-disciplinary research in computer science, art, design, education or any combination of the above. It uses WebGL to calculate CA transition functions, allowing hardware accelerated implementations to run in the browser. It is light weight, dependency free and easy to embed in any web page. Utomata's minimalist functional syntax can express any algorithm up to outer-totalistic 4D continuous state systems or equivalent.


# Programming Guide <a name="guide"></a>

#### 1. Creating an HTML page <a name="create"></a>

Utomata is Javascript library that can work in any HTML page. To get started, create a new text file with the following text:

```html
<!DOCTYPE html>
<html>
   <body>
   </body>
   <script src="http://soogbet.gitbub.io/utomata/utomata.js"></script>
</html>
```
Saving this file with a .html extension and opening it with a modern Desktop browser (Preferably Chrome or Firefox) will tell it to render an empty page which accesses the utomata library directly from this repository.

#### 2. Instantiating utomata <a name="instance"></a>

Add the following script tag after the first script:

```HTML
<script type="text/javascript">
  var uto = new utomata(256, 256);
</script>
```
This second script creates a new instance of utomata and stores it in a variable called *uto*. Our new system consists of 256 rows and 256 columns of cells (65,536 cells in total), and is now ready for work. A utomata system can be set to any size, however, powers of two (2, 4, 16, 32, ...) are generally better performant and very large systems (4K+) require dedicated graphics hardware in order to run smoothly.  

#### 3. Applying a transition function <a name="trans"></a>

Now that we have set up our page and our system, we may ask utomata to have all of its cells do something at regular intervals. Add the following line to the second script tag:

```js
uto.run("vec(1, 0, 0, 1)");
```
The run() method accepts a transition rule that is applied to every cell in the system, (up to) 60 times per-second (fps). It is important to note that this rule is not a javascript function but a string containing instructions in a special syntax that runs on our graphics card. This is what allows utomata to calculate large systems at high frame rates.

The above transition rule is a constant 3D vector. Utomata uses vectors to describe cell states as RGBA color. As such, each component in this vector conforms to its corresponding color component. Applying it as the transition function means that at each time step (also called a frame), each and every cell will adopt these 4 numbers as its new state - 1 for red, 0 for green, 0 for blue, and 1 for alpha (transparency), resulting in a static uniformly red system.

```js
uto.run("vec(1, 0.5 ,1)");
```
Utomata state vectors are normalized, that is, they are capped to numbers between zero and one. If the 4th vector component is not provided, alpha is assumed to 1.0 - fully opaque. The above rule tells all cells to have full Red, half green and full blue, resulting in pink. This notation can express any color that our screen can display.

```js
uto.run("vec(cell.x, cell.y, 0)");
```
Uniform systems are ones in which all cells have the same color. This, of course, is the simplest possible transition rule, of which there are exactly 256^4 unique variations - all possible values of 32bit float color. The above rule uses the X and Y position of each cell to affect its red and green color respectively. Note that cell positions are also normalized such that the top left cell is at (0,0) and the bottom right cell is at (1, 1).

```js
uto.run("vec(random())");
```
Static systems are also quite simple, as cell states never actually change over time. Running the above transition function will result in *white noise*, running at 60 fps. The random() function returns a normalized floating point number that each cell then adopts as its new state. Providing only a single number to a vector sets it to all four vector components, resulting in greyscale color.


<!-- Cells in a utomata system have a continuous, normalized 4D state. under the hood, they are calculated as GLSL fragment shaders, but utomata uses a higher level functional syntax for expressing the transition function applied to each cell.
All operators are able to mix vector dimensions in order to increase the range of valid programs. Of course, program validity does not ensure that the program produces useful, or even remotely coherent results; most possible programs emphatically do not.

The return value for all operators is always a 4 dimensional vector, however, the actual output of the system - how it translates a 4D state into colour, depends on the global stateDimension setting listed above. -->

#### Operators

<!--
maybe add the unary and binary operators here?
It means providing two examples and quickly listing all operators here, and linking them to below.  
-->


Below is a collection of simple transition functions to play around with:

```GLSL
// calculate the distance from the cursor
vec(dst(cell.xy, cursor.xy))
```
```GLSL
// create horizontal waves using the sine function and the time-step variable
vec(sin(time*0.05 + cell.x*20)*0.5 + 0.5)
```

```GLSL
// explore perlin noise using the mouse
vec( noise(cell.xy*2 + cursor.xy*100) )
```

<!-- #### Notes:
on random and noise in GLSL -->


#### 4. Accessing the Neighbourhood <a name="neighbour"></a>

The examples in the previous section outlined the use of various formulae to control the colors of individual cells procedurally. This was done by using static vectors, mathematical operators, built-in variables and a number of functions that are commonly used in procedural content generation, such as sine, random and perlin noise. This echos the approach of programming fragment shaders from scratch, somewhat like in GLSLSandbox or ShaderToy. In fact, anything that was created on those websites can be adapted to utomata, as they are all based on the same underlying language - GLSL. However, This approach is not Cellular Automata, as it lacks a crucial ingredient - the **neighbourhood**. This section will introduce how to use neighbourhoods in our program and will demonstrate how this can lead to emergent, as opposed to procedural patterns.

##### V
The built-in variable **V** (for Value) holds the cell's state. That is, if the transition function sets a new value for each cell, **V** keeps its current value for us to use in that transition. Consider the following:

```GLSL
frc(add( V , 0.01 ))
```
The transition function above takes the current value of each cell and adds 0.01 to all 4 components. The result is then stripped to its fractional part by using the unary operator - frc(), thus creating a looping mechanism.

<!-- ```GLSL
setup = vec(noise(cell.xy*3));
update = vec(frc(V.r + 0.01));
``` -->

##### Outer-Totalistic Neighbourhoods

Just as each cell can access its own value, it can also access the values of other cells. The function **U(x,y)** returns the current state of any cell. The X and Y parameters are coordinates relative to the cell. Such that U(0,0) is the same as V, U(0, -1) is refers to the one directly above the it, and U(0, 1) is its adjacent neighbour on the right.

```GLSL
// calculate the sum of the 4 adjacent neighbours (Von Neumann Neighbourhood)
vec4 VNtotal = U(-1,0) + U(0, -1) + U( 1, 0) + U(0,1);
// simple blur transition using avarage
update = div(VNtotal, 4);
// make the pen 30 pixels wide
pen.w = 30;
```
Accessing neighbour values can yield incredible complexity to the system, as it can bring rise to feedback loops in cell behaviours. Note that even though all cells execute the exact same transition function, they get different results because their neighbourhoods are different.  

```GLSL
// configure to random RGB
setup = vec(random(1),random(2),random(3));

// obtain a random coordinate between -2 and 2 using perlin noise
float nx = noise( (cell.xy*2) +time*0.01)*4-2;
float ny = noise( (cell.xy*-2) +time*0.01)*4-2;

// round up the coordinates and use them to get a neighbouring value.
update = U(rnd(nx), rnd(ny));
```
The transition function above uses perlin noise for obtaining the value of a random neighbour and then adopts it, as is, as the new state of the cell. The consistency of the perlin noise function causes distinct clusters to emerge as different regions of the system pull towards the same direction.

##### Totalistic Neighbourhoods

Many cellular automata algorithms use a *totalistic neighbourhood*. This means that each cell refers to its neighbours only by summing up their accumulative states and using this total value in its transition function. The most commonly used totalistic neighbourhoods are the Von-Neumann neighbourhood (A) and the Moore neighbourhood (B):

```GLSL
- + - | + + +
+ * + | + * +
- + - | + + +
A       B
```

Utomata has a number of built-in neighbourhoods ready for use:

```GLSL
- - - | - + - | - + - | + + +
- * - | - - - | - * - | - - -
- - - | - - - | - - - | - - -
V       V1      V2      V3

- + - | - + - | + + + | + + +
+ - + | + * + | - - - | - * -
- + - | - + - | + + + | + + +
V4      V5      V6      V7

+ + + | + + + |
+ - + | + * + |
+ + + | + + + |
V8      V9     
```

Note that some include the value of the cell itself within the total and others do not.
<!--
##### Custom neighbourhoods

Utomata allows the use of any other neighbourhood you might thing of, even N-body systems in which the neighbourhood is composed of all cells in the system. However, keep in mind that looping through the entire system ~60 times per-second features exponential computational complexity - O(N^2), and is not generally suitable for large systems.

```GLSL
vec4 total = vec4(0);

for(float i = 0; i < 32; i+=1.0){
	for( float j = 0; j < 32; j+=1.0){
		vec2 other = vec2(i/grid.x, j/grid.y);
		total += val(other.x, other.y) ;
	}
}
total /= (grid.x*grid.y);

update = total;
``` -->

#### 5. Applying a Configuration <a name="config"></a>

CA's are often chaotic systems; extremely sensitive to initial conditions. The initial state of a system is called the *configuration* and it plays a vital role in its behaviour. In utomata this can be configured using the setup variable or the setup method. Consider the following:

```GLSL
// configure to a random value (greyscale)
setup = vec(random());
```

```GLSL
// configure to a random value (RGB)
setup = vec(random(1), random(2), random(3));
```

```GLSL
// configure to random binary (10% white)
setup = vec( stp(random(), 0.1));
```

```GLSL
// configure to black with a white dot at the center
setup = vec( stp(dst(vec2(0.5), cell.xy), cell.w ));
```

### Case Studies <a name="examples"></a>


#### Elementary Automata <a name="elementary"></a>


#### Game of Life <a name="GOL"></a>

```GLSL
add(eql(3, V9), mlt(eql(4, V9), V))
```

Let us unpack the algorithm into its components:

```GLSL
add(                  // add up the following two operations
    eql(3, V9),       // return 1 if the Moore Neighbourhood (inclusive) is equal to 3, otherwise 0
    mlt(              // multiply the following two operations
	eql(4, V9),   // return 1 if the Moore Neighbourhood (inclusive) is equal to 4, otherwise 0
	V             // return the value of the cell in question
    )                 // end multiply
)                     // end add
```

```GLSL
// configure to random binary: 10% white
setup = vec( stp(random(), 0.1) );
// use a 10px wide pen
pen.w = 10;
// run Conway's game of life
update = add(eql(3, V9), mlt(eql(4, V9), V));
```
Finally, add a configuration and increase the pen size

#### Abelian Sandpile <a name="sandpile"></a>

```GLSL
vec4 T =
	stp(1, U(-1, 0)) +
	stp(1, U(0, -1)) +
	stp(1, U(1, 0)) +
	stp(1, U(0, 1));

update =
	vec( stp(dst(vec2(0.5), cell.xy), cell.w )) + // center dot
	mlt(V, stp(V, 0.99)) + // collapse a full cell
	mlt(0.25, T); // add from collapsed neighbour
```

#### Reaction Diffusion <a name="RD"></a>

```GLSL
// create variables
float diffR = 0.22;
float diffG = 0.05;
float F = 0.036;
float K = 0.061;
float rgg = V.r * V.g * V.g;
vec4 hood = V4 - V * 4.0;

update = add(frc(V), vec( diffR * hood.r  - rgg + ( F*(1.0 - V.r)), diffG * hood.g  + rgg - ( (K + F)* V.g), 0,0));

```

### Utomata API <a name="api"></a>

#### Utomata(width, height) <a name="methods"></a>
The constructor creates a new instance of utomata and appends a canvas element of the same size to the **body** tag.

```js
var uto = new Utomata(1024, 1024);
```

#### run(transition)
The run() method starts calculating the system at up to 60 frames per second. It accepts a transition function (in string format). The transition is then applied to each cell in the system at each time step. If no transition is provided the previously used transition will be used. The default transition is "update = V;"

```js
// run a white noise transition function
uto.run("vec(random());");
```

#### stop()
The stop method pauses a currently running system. The same system can subsequently be resumed by calling run() with no parameters.

```js
uto.stop();
```

#### setup(config = null)
The setup method configures the system to its initial state. It also accepts an optional configuration rule as a string. The configuration can use any operators but cannot access the neighbourhood (V values, U and val functions) because cells have no value at the time of configuration.

```GLSL
// configure to a previously defined config function
uto.setup();

// configure to a white initial state:
uto.setup("vec(1)");

// configure to a random RGB color
uto.setup("vec(random(1), random(2), random(3),)");

// configure to a random binary state with 10% white
uto.setup("stp(random(), 0.1)");

// configure using perlin noise
uto.setup("noise(cell.xy*10)");

```

#### size(width, height)
The size method creates a new system with the new width and height provided, without calling the constructor. Note that this will reset the system to its current configuration.

```GLSL
// resize to 256 by 256
uto.size(256, 256);
```

#### width(value)
The width method creates a new system with a new width and current height, without calling the constructor. Note that this will reset the system to its current configuration.

```GLSL
// change width to 16
uto.width(16);
```

#### height(value)
The height method creates a new system with a new height and current width, without calling the constructor. Note that this will reset the system to its current configuration.

```GLSL
// change height to 1024
uto.size(1024);
```

#### fps(n)
The fps() method determines the framerate of utomata - that is - how many steps-per-second the system runs. Values between 0 (none) and 60 are accepted. Note that the actual framerate depends greatly on the width and height of the system and on your graphics card. setting the framerate to 60 means that utomata will TRY to render at 60 fps, but the actual rate is likely to be less than that.

```js
// run utomata at 12 steps per second
uto.fps(12);
```

#### zoom(value)
The zoom method changes the size of the canvas while keeping the cell count intact. The paramater can generally be thought of the number of pixels occupied by each cell.

```js
// set magnification to 16 pixels per cell
uto.zoom(16);
```

```js
// set magnification to 4 cells per pixel
uto.zoom(0.25);
```

#### edge(type)
Utomata has two ways to treat the cells which are at the egde of the system (for example the first row, which has no cells above it). "CLAMP" means that whenever a cell at the edge looks-up a neighbour that isn't there - the result will be 0. "REPEAT" means that the look-up will wrap around the other side of the system so that, for instance, the cell directly ABOVE the one at (0,0) is the cell at (0,1). Note that "REAPEAT" only works for systems whose width and height are powers of two. Calling the edge method will reset the system to its configuration.

```js
uto.edge("REPEAT");
```


#### input(img)
Utomata accepts an optional input image. It can be used both in the configuration rule and also in the program itself using the I value and I() function. The input must be a reference to an HTML <img> element.

```js
// set input image from the document
uto.input(document.getElementById("myImg"));
```

```js
// stop using an image and set config rule intsead
uto.input(false);
uto.config("vec(0)")
```

#### seed(n)
Utomata uses an internal (and quite simple) pseudorandom number generator. The seed value can be set for getting deterministic results from the random() function.

```js
uto.seed(4.2342562);
```

#### setUniform(key, value)
Utomata accepts external variables to allow input from UI elements, external API's, sensors, etc. These are known as uniforms because their value would be the same for all cells in the system. Uniforms are entered as key-value pairs, and once entered can be used inside the transition function as float variables. Changing a value for an existing key works the same way as inserting it.

```HTML
<input type="range" min="0" max="1.0"  step="0.01" value=".5" onchange="uto.setVar('redValue', this.value)" >
```

```js
// set an initial value
uto.setVar('redValue', 0.5);
// run the system
uto.run("V = vec(redValue,0,0);");
```

<!-- #### saveImage()
Return a reference to the system as an image. This is useful for saving, displaying or rerouting to another system.

```js
// get current list of uniforms
``` -->

#### errors() <a name="getters"></a>
Return an array of current shader errors, if no errors exist the array will be returned empty.

```js
console.log(uto.errors());
```

#### getUniforms()
Return an object containing the key-value pairs for all uniforms defined on the system.

```js
var uniforms = uto.getUniforms();
```

#### getInfo()
Return a formatted string containing realtime system info

```js
console.log(uto.getInfo());
```

#### getWidth()
Return the current number of columns in the system

```js
var utoWid = uto.getWidth();
```

#### getHeight()
Return the current number of rows in the system

```js
var utoHei = uto.getHeight();
```

#### getEdgeType()
Return the current edge type

```js
console.log(uto.getEdgeType());
```

#### getTransition()
Return the current transition function

```js
console.log(uto.getTransition());
```

#### getSetup()
Return the current configuration function (only if set via the setup method)

```js
console.log(uto.getSetup());
```

#### getCursorX()
Return the current normalized position of the cursor on the x axis

```js
console.log(uto.getCursorX());
```

#### getCursorY()
Return the current normalized position of the cursor on the x axis

```js
console.log(uto.getCursorY());
```

## Language Reference <a name="ref"></a>

### Data Types <a name="types"></a>

#### float

#### vec(a, b, c, d)
<!-- Return a vector value. This operator accepts 1,2,3 or 4 float values but always returns a 4D vector.
vec(a) >> vec4(a, a, a ,a);
vec(a, b) >> vec4(a, a, a ,b);
vec(a, b, c) >> vec4(a, b, c, 1.0);
vec(a, b, c, d) >> vec4(a, b, c, d); -->


### Variables <a name="vars"></a>

#### V

#### V1, V2, ..., V9

#### grid

#### pen

#### cursor

#### cell


### Binary operators <a name="binary"></a>

#### add(a, b)
#### sub(a, b)
#### mlt(a, b)
#### div(a, b)
#### pow(a, b)
#### mod(a, b)
#### stp(a, b)
#### eql(a, b)
#### min(a, b)
#### max(a, b)
#### dot(a, b)
#### dst(a, b)

### Unary operators <a name="unary"></a>

#### cil(a)
#### flr(a)
#### rnd(a)
#### sqt(a)
#### log(a)
#### sgn(a)
#### frc(a)
#### nrm(a)
#### sin(a)
#### cos(a)
#### tan(a)
#### asn(a)
#### acs(a)
#### atn(a)

### Misc <a name="misc"></a>

#### U(x, y)

#### val(a, b)

#### random(seed = null)

#### noise(position.xy)
