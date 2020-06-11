
# utomata

A javascript/webGL framework for interactive, browser based [Cellular Automata] (https://en.wikipedia.org/wiki/Cellular_automaton) experiments. It is designed for exploration of nonlinear systems in computational arts and design, modelling, simulation and procedural content generation.

utomata performs all calculations on the graphics card and draws the result onto the HTML canvas element. It uses a minimalist functional syntax, based on GLSL, for describing transition functions. The framework is capable of describing a wide range of models including binary state automata, 2D continuous state systems, reaction-diffusion and  even N-body systems, such as swarms or particle systems.

*This project is in early stages of development. Please contact me for enquiries.* 

* [Online editor](https://soogbet.github.io/utomata)
* [Programming guide](https://github.com/soogbet/utomata/wiki/Programming-guide)
* [Language reference](https://github.com/soogbet/utomata/wiki/Language-reference)

## Basic usage

```html
<!DOCTYPE html>
<html>
   <head>
      <script src="utomata.js"></script>
      <script type="text/javascript">
         // create a system with one million cells
         var uto = new utomata(1024, 1024);
         
         // run the system
         uto.run(`
            // reset all cells to random binary state
            config = vec(rnd(rdm()));
         
            // run conwway's game of life
            V = add(eql(3, V9), mlt(eql(4, V9), V));
         `);
      </script>
   <head>
   <body>
   </body>
</html>
```
