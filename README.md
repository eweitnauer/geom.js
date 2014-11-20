#geom.js

Client-side javascript library for working with 2D points, polygons and circles as well as rational vectors and matrices of any dimension. There are sparse vector and matrix classes as well.

The 2D shapes can be loaded from SVG elements and be converted back. The polygon can also be constructed from an SVG path.

The library also allows to get gradual spatial relations between shapes using Isabelle Block's [fuzzy relative position algorithm](http://ieeexplore.ieee.org/xpl/freeabs_all.jsp?arnumber=777378).

## Usage

Copy the `geom.min.js` file into your project folder and include it in your html page.

## Development

Run clone the repository and run `npm install`, then `make` and `make test` will build the geom.js library from the source file and run all tests.