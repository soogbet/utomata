![utomata](https://github.com/soogbet/utomata.js/raw/master/documentation/utomataBanner.png "utomata")

## utomata.js

utomata is a lightweight, dependency-free javascript framework for cellular automata (CA). It uses WebGL for rendering onto the HTML canvas element, allowing browser based fast rendering of a wide range of CA algorithms. The framework uses a custom functinal syntax for describing transition functions. It is designed for interactive explorations of novel algorithms in computational art and design, modeling, simulation and procedural content generation.

This project is still in production. feel free to contact me for enquiries. 

* [Wiki](https://github.com/soogbet/utomata.js/wiki)
* [Programming guide](https://github.com/soogbet/utomata.js/wiki/Programming-guide)
* [Language reference](https://github.com/soogbet/utomata.js/wiki/Language-reference)
* [Online editor](http://labofbabel.org/utomata)

## Basic usage

```html
<!-- in HTML, add a link to utomata lib -->
<script src="http://labofbabel.org/utomata/utomata.js"></script>
```

```javascript
// in a your script, instantiate a system
var uto = new Utomata();

// basic setup, passing width and height as parameters
uto.setup(1024, 1024);

// run Conway's game of life
uto.run( "V = add( eql(3.0, V9), mlt( eql(4.0, V9), V))" );

```
