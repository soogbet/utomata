
# UTOMATA
<i>utomata</i> is a Javascript/webGL framework for interactive, browser based [Cellular Automata](https://en.wikipedia.org/wiki/Cellular_automaton) experiments. It is designed for exploration of emergent virtual structures in computational art and design, modelling, simulation and procedural content generation.

<!-- Examples collection on codepen -->
<!-- other links ? -->
<!-- a touchdesigner COMP implementation -->
[utomata.net](https://utomata.net)
[sandbox](https://soogbet.github.io/utomata/)
[lib](https://soogbet.github.io/utomata/utomata.js)
[labofbabel.org](http://labofbabel.org)

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



# Introduction <a name="intro"></a>

[Cellular Automata](https://en.wikipedia.org/wiki/Cellular_automaton) (CA) is a family of algorithms featuring discrete entities *(cells)* that continuously interact with one another. Typically, the cells are organised as a fixed, two dimensional grid. At regular intervals *(time steps)*, each cell calculates its new value *(state)* using a mathematical or logical formula *(transition function)*, while consulting the states of cells around it *(neighbourhood)*. This causes a feedback loop from which complex, higher-order structures may emerge.

There are countless possible transition functions, most of which quickly drive the system towards either uniformity or noise. However, there are also (countless still) functions that result in the emergence of coherent structures that posses interesting, beautiful and potentially even useful patterns of behaviour.

Utomata is Javascript/WebGL framework for exploration and study of novel cellular automata algorithms. It is designated for cross-disciplinary research with an emphasis on computational arts and artificial life. It's light weight, dependency free, hardware accelerated and easy to embed in any web page. Utomata's minimalist functional syntax can express any algorithm up to outer totalistic, any-neighbour, 4D continuous state CA's.


# Programming Guide <a name="guide"></a>

#### 0. Getting started <a name="create"></a>

Utomata can work in any HTML page. To get started create a new text file using a code editor such as [atom](https://atom.io/), paste the following snippet and save it as: uto1.html. Then open the file using a web browser.
NB: you can also follow this guide using the [sandbox](https://soogbet.github.io/utomata/), or in [utomata.net](https://utomata.net)

```html
<!DOCTYPE html>
<html>
   <body></body>
   <script src="https://soogbet.github.io/utomata/utomata.js"></script>
   <script>
     // create a system with 1M cells
     var uto = new  utomata(1024, 1024);
     // configure to random binary: 10% white
     uto.setup("vec( stp(rand(), 0.1) )");
     // run Conway's game of life
     uto.run("add(eql(3, V9), mlt(eql(4, V9), V))");
   </script>
</html>
```

#### 1. Transition Function <a name="trans"></a>

```js
uto.run("vec( 1.0, 0.0, 0.0 )");
```

The run() command expects a transition function that is to be applied to every cell in the system, (up to) 60 times per-second. Note that the transition function is not a javascript function but a string containing instructions in a special syntax that runs on the graphics card. This is what allows utomata to calculate large systems at high frame rates.

utomata uses four dimensional vectors to describe cell states as RGBA color. the vec() function thus always returns a 4D vector. Each component in the above vector conforms to a corresponding color component - red, green and blue. So the above transition function asks for full red, no green and no blue, resulting in a static uniformly red system. For now, we will ignore the alpha channel and just consider RGB color. Note that even though the system appears static - each one of its cells actually chooses that red color 60 times every second. Here are a number of other simple transition functions:

```js
// Provideing just one value to vec applies it to all 3 components
uto.run("vec( 1.0 )");
```

```js
// Any RGB color. values above 1.0 or below 0.0 are clamped.
uto.run("vec(0.98, 0.5 , 0.34)");
```

```js
// Set to a random value at each frame
uto.run("vec( rand() )");
```


#### 2. Variables

utomata comes with a number of built in variables.
NB: We will now only focus on the transition function that goes into uto.run(). you can use the following snippet:


```js
var uto = new  utomata(256, 256);
uto.run(`
  --your-code-here--
  `);
```

```GLSL
// Use the x and y coordinate of the cell to set its red and green values
vec(cell.x, cell.y, 0.)
```

```GLSL
//
vec(crsr.x, crsr.y, 0.)
```

```GLSL
// Use the cursor position to move along a perlin noise landscape
uto.run("vec(nois(cell.xy crsr.xy)))");
```



#### Operators

<!--
maybe add the unary and binary operators here?
It means providing two examples and quickly listing all operators here, and linking them to below.
-->


Below is a collection of simple transition functions to play around with:

```GLSL
// calculate the distance from the cursor
vec(dst(cell.xy, crsr.xy))
```
```GLSL
// create horizontal waves using the sine function and the time-step variable
vec(sin(time*0.05 + cell.x*20)*0.5 + 0.5)
```

```GLSL
// explore perlin noise using the mouse
vec( nois(cell.xy*2 + cursor.xy*100) )
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
The constructor creates a new instance of utomata and appends a canvas element of the same size to the body HTML tag.

```js
var uto = new Utomata(1024, 1024);
```

#### run(transition)
The run() method starts calculating the system at up to 60 frames per second. It accepts a transition function (in string format). The transition is then applied to each cell in the system at each time step. If no transition is provided the previously used transition will be used. The default transition is "update = V;"

```js
// run a white noise transition function
uto.run("vec(rand());");
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
uto.setup("rand(1.0, 2.0, 3.0)");

// configure to a random binary state with 10% white
uto.setup("stp(rand(), 0.1)");

// configure using perlin noise
uto.setup("nois(cell.xy)");

```

#### size(width, height)
The size method resets the system with the new width and height provided.

```GLSL
// resize to 256 by 256
uto.size(256, 256);
```

#### width(value)
The width method resets the system with a new width and current height.

```GLSL
// change width to 16 cells
uto.width(16);
```

#### height(value)
The height method resets the system with a new height and current width.

```GLSL
// change height to 1024
uto.height(1024);
```

#### fps(n)
The fps() method determines the max framerate of utomata. It accepts any integer value between 0 (stop) and 60. Note that the actual framerate depends greatly on the size and type of the system and on your hardware.

```js
// run utomata at 12 steps per second
uto.fps(12);
```

#### zoom(value)
The zoom method changes the size of the canvas without affecting the system itself.

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
Utomata accepts an optional static input image. It can be used both in the configuration rule and also in the program itself using the I value and I() function. The input must be a reference to an HTML <img> element.

```js
// set input image from the document
uto.input(document.getElementById("myStaticConfig"));
```

```js
// stop using an image and set config rule intsead
uto.input(false);
uto.config("vec(0.0)");
```

#### seed(n)
Utomata uses an internal pseudorandom number generator. The seed value can be set for getting deterministic results from the rand() function.

```js
uto.seed(4.2342562);
```

#### setUniform(key, value)
Utomata can make use of external variables to allow input from UI elements, external API's, sensors, etc. These are known as uniforms because their value is the same for all cells in the system. Uniforms are entered as key-value pairs, and once entered can be used inside the transition function as float variables. Changing a value for an existing key works the same way as inserting it.

```HTML
<input type="range" min="0" max="1.0"  step="0.01" value=".5" onchange="uto.setVar('redValue', this.value)" >
```

```js
// set an initial value
uto.setVar('redValue', 0.5);
// run the system
uto.run("V = vec(redValue,0,0);");
```

#### saveImg()
Download the canvas as a png file.

```js
uto.saveImg();
```
#### getImg()
returns a refernce to the image as a javascript object.

```js
var currentState = uto.getImg();
document.getElementById("myImage").src = currentState;
```

#### errors() <a name="getters"></a>
Return an array of current errors in utomata.

```js
console.log(uto.errors());
```

#### getUniforms()
Return an object containing the key-value pairs for all uniforms defined on the system.

```js
console.log( uto.getUniforms() );
```

#### getInfo()
Return a formatted string containing realtime system info

```js
console.log( uto.getInfo() );
```

#### getWidth()
Return the current number of columns in the system

```js
console.log( uto.getWidth() );
```

#### getHeight()
Return the current number of rows in the system

```js
console.log( uto.getHeight() );
```

#### getEdgeType()
Return the current edge type

```js
console.log( uto.getEdgeType() );
```

#### getTransition()
Return the current transition function

```js
console.log( uto.getTransition() );
```

#### getSetup()
Return the current configuration function (only if set via the setup method)

```js
console.log( uto.getSetup() );
```

#### getCursorX()
Return the current normalized position of the cursor on the x axis

```js
console.log( uto.getCursorX() );
```

#### getCursorY()
Return the current normalized position of the cursor on the x axis

```js
console.log( uto.getCursorY() );
```

## Language Reference <a name="ref"></a>


### Neighbourhood <a name="vars"></a>

#### Totalistic Neighbourhoods

##### ``V, V1, V2, V3, V4, V5, V6, V7, V8, V9, V24, V25``

Many cellular automata algorithms use a *totalistic neighbourhood*. This means that each cell refers to its adjacent cells only by summing up their state values and using the total in its transition function.

utomata has a number of built-in values for commonly used totalistic neighbourhood types. You can may use any combination of these in the same transition function. The following diagram illustrates all available ones. all of these return a 4D vector representing the sum RGBA values of the corresponding neighbours.
NB: the value of the cell itself is also considered as a neighbourhood type.


```GLSL
- - - | - + - | - + - | + + + | - + -
- + - | - - - | - + - | - - - | + - +
- - - | - - - | - - - | - - - | - + -
V       V1      V2      V3     V4

- + - | + + + | + + + | + + + | + + +
+ + + | - - - | - + - | + - + | + + +
- + - | + + + | + + + | + + + | + + +
V5      V6      V7      V8      V9

+ + + + + | + + + + +
+ + + + + | + + + + +
+ + - + + | + + + + +
+ + + + + | + + + + +
+ + + + + | + + + + +
V24         V25
```

#### Outer-Totalistic Neighbourhoods

##### ``U(x,y)``

A cell can also access the individual values of other cells using *relative* coordinates. The *U(x,y)* function returns the current state of any cell in the system relative to self, so that: U(0,0) is the same as V, U(0, -1.0) refers to the cell directly above, and U(0, 1.0) is the adjacent neighbour on the right. you can use the U(x,y) function to construct outer-totalistic transition functions or custom totalistic neighbourhoods.

```GLSL
// Von-Neumann Neighbourhood (same as V4)
vec4 VN = U(-1,0) + U(0, -1) + U( 1, 0) + U(0,1);
// only diagonal neighbours
vec4 Diag = U(-1., -1.) + U( 1., -1.) + U(-1., 1.) + U( 1., 1.);
```

##### ``get(x,y)``

A cell can also access individual values of other cells using *absolute* coordinates. In this case the x and y coordinates signify cell positions between top-left (0, 0) and bottom-right (1,1).

```GLSL
// use the value of the cell pointed by the cursor
add(V, get(crsr.x, crsr.y))
```


### Operators

utomata uses a functional programming paradigm. At its core are a set of operators that operate on floating point 4D vectors.


#### ``vec(a, b, c, d)``
Return a 4D vector using parameters. This operator accepts 1,2,3 or 4 float values and always returns a 4D vector. Consider the following scheme:

```GLSL
vec(a) >> vec4(a, a, a ,a)
vec(a, b) >> vec4(a, a, a ,b)
vec(a, b, c) >> vec4(a, b, c, 1.0)
vec(a, b, c, d) >> vec4(a, b, c, d)
```

### Binary operators <a name="binary"></a>

For binary operators, utomata will always return a 4D vector regardless of input. This may sometimes be confusing as the input may be a float, a vec or one float and one vec. Consider the following scheme:

```GLSL
op(f1, f2) >> vec(op(f1, f2), op(f1, f2), op(f1, f2), op(f1, f2))
op(V1, V2) >> vec(op(V1.r, V2.r), op(V1.g, V2.g), op(V1.b, V2.b), op(V1.a, V2.a))
op(f, V)   >> vec(op(f, V.r), op(f,V.g), op(f,V.b), op(f,V.a))
op(V, f)   >> vec(op(V.r, f), op(V.g, f), op(V.b, f), op(V.a, f))
```

#### ``add(a, b)``
Return the sum of **a** and **b**.

#### ``sub(a, b)``
Subtract **b** from **a**

#### ``mlt(a, b)``
Multiply **a** by **b**

#### ``div(a, b)``
Divide **a** by **b**

#### ``pow(a, b)``
Raise **a** to the power of **b**

#### ``mod(a, b)``
Return the remainder of **a** divided by **b**

#### ``stp(a, b)``
Return **vec(1.0)** if **b** is larger than **a**, otherwise return **vec(0)**

#### ``eql(a, b)``
Return **vec(1.0)** if **b** is equal to **a**, otherwise return **vec(0)**

#### ``min(a, b)``
Return the minimal value of **b** and **a**

#### ``max(a, b)``
Return the maximal value of **b** and **a**

#### ``dot(a, b)``
Return the dot product **a** and **b**

#### ``dst(a, b)``
Return the distance between **a** and **b**

#### ``atn(a, b)``
Return the two component arc tangent of **a** and **b**

### Unary operators <a name="unary"></a>

For Unary operators utomata uses a similar approach to the one above. It appplies the operator on each component of the input and returns the result as a 4D vector. It follows the following scheme:
```GLSL

op(f)              >> vec(op(f), op(f), op(f) ,op(f))
op(f1, f2)         >> vec(op(f1), op(f1), op(f1) ,op(f2))
op(f1, f2, f3)     >> vec(op(f1), op(f2), op(f3) , 1.0)
op(f1, f2, f3, f4) >> vec(op(f1), op(f2), op(f3) , op(f4))
op(V)              >> vec(op(V.r), op(V.g), op(V.b) ,op(V.a))
```
#### ``rnd(a)``
Rounded values of **a**

#### ``cil(a)``
Round up values of **a**

#### ``flr(a)``
Round down values of **a**

#### ``sqt(a)``
Return the Square root of **a**

#### ``log(a)``
Return the natural logarithm of **a**
#### ``sgn(a)``

Return the sign of **a** (-1. / 0. / 1. )
#### ``frc(a)``

Return the fractional part of **a**
#### ``nrm(a)``

Return the normalized vector of **a**

#### ``sin(a)``
Return the sine function of **a**

#### ``cos(a)``
Return the cosine function of **a**

#### ``tan(a)``
Return the tangent function of **a**

#### ``asn(a)``
Return the arc sine function of **a**

#### ``acs(a)``
Return the arc cosine function of **a**

#### ``atn(a)``
Return the arc tangent cosine function of **a**

### Functions <a name="misc"></a>

#### ``set(a, b)``

#### ``rand(seed)``

#### ``nois(x, y)``


#### grid

#### cell

#### crsr

#### pcrsr
