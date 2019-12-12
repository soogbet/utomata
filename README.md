

<h1>utomata.js</h1>


<h2>A webGL Javascript library for Cellular Automata</h2>
<p>developed at the <a href="http://labofbabel.org">LABORATORY OF BABEL</a></p>


<p>
utomata.js is a lightweight, dependency-free webGL-canvas library for browser based cellular automata experiments.
</p>

<h4>utomata features: </h4>
<ul>
	<li>hardware accelerated graphics for fast rendering. (up to 4K*4K grids at 60 fps)</li>
	<li>a functional programming syntax, designed for interactive exploration of new algorithms</li>
	<li>using an image or any rule for initial configuration</li>
	<li>support for mouse interation</li>
	<li>dependency free, lightweight JS library</li>
</ul>

<h4>How to use:</h4>
<ol>
	<li>
		link utomata to your HTML file and create a canvas element
	</li>
	<li>
		create an instace of utomata, passing the canvas id:
		<pre>
			var uto = new Utomata("utoCanvas");
		</pre>
	</li>
	<li>
		setup and configure utomata in one of three ways:
		<ol>
			<li>
				black configuration:
				<pre>
				uto.setup(1024, 1024);
			  </pre>
			</li>
			<li>
				add a third parameter for the configuration rule (here, a rounded random number is assigned to each cell );
				<pre>
				uto.setup(1024, 1024, "vec4( rnd(random()) )" );
			  </pre>
			</li>
			<li>
				configure with a url of an image (utomata will resize automatically):
				<pre>
				uto.setInput("config.png");
			  </pre>
			</li>
		</ol>
	</li>
	<li>
		run the system with a program (ie: Conway's Game of Life):
		<pre>uto.run("V = eql(3.0, V9) + (eql(4.0, V9) * V);");</pre>
	</li>
</ol>

<p>
	For more examples and an online programming environement visit <a href="http://labofbabel.org">labofbabel.org</a>
</p>
