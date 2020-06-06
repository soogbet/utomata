
## utomata is a javascript framework for cellular automata experiments.

Cellular Automata (CA) is a computational model featuring a grid of elements (cells) that interact with their immediate naighbours. utomata performs these calculations on graphics hardware using webGL and draws the result onto the HTML canvas element. This enables it to run fast and interactive web based CA implementations. utomata is designed for exploration and experimentation in computational art and design, modeling, simulation and procedural content generation. It uses a minimalist functinal syntax for describing transition CA functions and is capable of implementing many CA algorithm: anything from 1D Binary state elementary automata, and up to 4D, continous state, N-body simulations such as swarms and fluids.

*This project is in early stages of development. feel free to contact me for enquiries.* 

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
            config = vec(rnd(random()));
         
            // run conwway's game of life
            V = add(eql(3, V9), mlt(eql(4, V9), V));
         `);
      </script>
   <head>
   <body>
   </body>
</html>
```
