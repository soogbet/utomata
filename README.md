
#utomata.js

utomata is a light weight, dependency-free javascript framework for cellular automata (CA). It uses WebGL for rendering onto the HTML canvas element, allowing browser based fast implementation of a wide range of CA algorithms at interactive speeds. The framework is designed for exploration of emergent behaviours towards art and design projects, as well as for procedural content generation.


###Basic usage

```html
<!-- add a link to utomata lib -->
<script src="js/utomata.js"></script>
<!-- create an HTML canvas element -->
<canvas id="utoCanvas"></canvas>
```

```javascript
// create a system, passing the canvas ID
var uto = new Utomata("utoCanvas");

// basic setup with all black initial configuration
uto.setup(1024, 1024);

// run Conway's game of life
uto.run("V = eql(3.0, V9) + (eql(4.0, V9) * V);")

```

The Wiki contains a programming guide and language reference.
For more information about this project, visit [labofbabel.org](http://labofbabel.org)
