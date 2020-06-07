
## utomata is a javascript framework for cellular automata experiments.

Cellular Automata (CA) is a computational model that features a grid of elements (cells) that interact with their immediate neighbours. utomata performs these calculations on graphics hardware using webGL and draws the result onto the HTML canvas element. utomata is designed for exploration and experimentation in computational art and design, modelling, simulation and procedural content generation. It uses a minimalist functional syntax for describing CA programs, capable of describing  anything from 1D Binary state elementary automata, up to 4D, continuos state, N-body simulations.

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
