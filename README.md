
# utomata
<i>utomata</i> is a javascript/webGL framework for interactive, browser based [Cellular Automata](https://en.wikipedia.org/wiki/Cellular_automaton) experiments. It is designed for exploration of emergent virtual structures in computational art and design, modelling, simulation and procedural content generation.

## Main Features:
* Parallel: all calculations are done on the graphics card, allowing fast implementation of large systems
* light wight, dependency free and easy to embed in any web page.
* Interactive, hackable and live coded.
* Input/output allows chaining systems together for advanced applications.
* Variable neighbourhoods: can use anything from no - to all neighbours (or any mix)
* Features 4D normalised continuous state vectors
* A minimalist functional syntax (based on GLSL), capable of describing a wide range of computational models: binary state automata, 2D continuous state systems, reaction-diffusion and even N-body simulations.

*This project is in early stages of development. Please contact me for enquiries.*

* [Online editor](https://soogbet.github.io/utomata)
* [Programming guide](https://github.com/soogbet/utomata/wiki/Programming-guide)
* [API](https://github.com/soogbet/utomata/wiki/utomata-API)
* [Language reference](https://github.com/soogbet/utomata/wiki/Language-reference)

## Basic usage

```html
<!DOCTYPE html>
<html>
   <body></body>
   <script src="utomata.js"></script>

   <pre id="pgm" style="display:none;">
     // configure to random binary: 10% white
     setup = vec( stp(random(), 0.1) );
     // use a 10px wide pen
     pen.w = 10;
     // run Conway's game of life
     update = add(eql(3, V9), mlt(eql(4, V9), V));
   </pre>

   <script>
      // create a system with one million cells
      var uto = utomata(1024, 1024);
      // run a transition function
      uto.run(document.getElementById("pgm").textContent);
      // set to initial state
      uto.config();
   </script>
</html>
```
