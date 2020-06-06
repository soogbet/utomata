
## utomata.js

**utomata** is a lightweight javascript/WebGL framework for interactive cellular automata (CA) experiments. It performs calculations on the GPU and draws onto the HTML canvas element, allowing fast and interactive browser based implementations. utomata is designed for exploration and experimentation in computational art and design, modeling, simulation and procedural content generation. It uses a minimalist functinal syntax for describing transition functions and is capable of implementing any CA algorithm - from 1D Binary state elementary automata up to 4D continous state N-body systems.

*This project is still in early development. feel free to contact me for enquiries.* 

* [Online editor](https://soogbet.github.io/utomata.js/)
* [Programming guide](https://github.com/soogbet/utomata.js/wiki/Programming-guide)
* [Language reference](https://github.com/soogbet/utomata.js/wiki/Language-reference)

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
