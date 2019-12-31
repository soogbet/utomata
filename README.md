![utomata](https://github.com/soogbet/utomata.js/raw/master/documentation/utomataBanner.png "utomata")

## utomata.js

utomata is a lightweight, dependency free javascript framework for generalized cellular automata (CA). It uses WebGL for rendering onto the HTML canvas element, allowing browser based fast implementation of a wide range of CA algorithms at high frame rates. The framework is designed for exploration of emergent behaviours towards art and design projects, as well as for procedural content generation.

This project is developed and maintained by the [Laboratory of Babel](http://labofbabel.org).

* [utomata Wiki](https://github.com/soogbet/utomata.js/wiki)
* [Programming guide](https://github.com/soogbet/utomata.js/wiki/Programming-guide)
* [Language reference](https://github.com/soogbet/utomata.js/wiki/Language-reference)
* [About utomata](http://labofbabel.org/utomata-meta)
* [Online editor](http://labofbabel.org/utomata)

## Basic usage

```html
<!-- in HTML, add a link to utomata lib -->
<script src="js/utomata.js"></script>
```

```javascript
// in a your js script, instantiate a system
var uto = new Utomata();

// basic setup, passing width and height as parameters
uto.setup(1024, 1024);

// run Conway's game of life
uto.run("V = add(eql(3.0, V9), mlt((eql(4.0, V9), V)))" );

```
