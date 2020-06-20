
# utomata
<i>utomata</i> is a javascript/webGL framework for browser based [Cellular Automata](https://en.wikipedia.org/wiki/Cellular_automaton) experiments. It is designed for exploration of emergent virtual structures in computational art and design, modelling, simulation and procedural content generation.

## Features:
* GPGPU: all calculations are done on graphics hardware, allowing fast implementation of large systems
* light wight, dependency free and easy to embed in any web page.
* Interactive, hackable and live coded.
* Input/output allows chaining systems together for advanced applications.
* Variable neighbourhoods: can use anything from no - to all neighbours (or any mix)
* Up to 4D continuous state per system (chaining systems together allows even more)
* A minimalist functional syntax (based on GLSL), capable of describing a wide range of computational models: binary state automata, 2D continuous state systems, reaction-diffusion and even N-body simulations.

*This project is in early stages of development. Please contact me for enquiries.*

* [Online editor](https://soogbet.github.io/utomata)
* [Programming guide](https://github.com/soogbet/utomata/wiki/Programming-guide)
* [Language reference](https://github.com/soogbet/utomata/wiki/Language-reference)

## Basic usage

```html
<!DOCTYPE html>
<html>
   <head>
      <script src="https://soogbet.github.io/utomata/utomata.js"></script>
      <script type="text/javascript">
         // create a system with one million cells
         var uto = new utomata(1024, 1024);

         // run the system
         uto.run(`
           // configure to random binary: 10% white
           conf = vec( stp(rdm(), 0.1) );

           // change mouse radius to 10 cells
           irad = 10;

           // run Conway's game of life
           V= add(eql(3, V9), mlt(eql(4, V9), V));
         `);
      </script>
   <head>
   <body>
   </body>
</html>
```
