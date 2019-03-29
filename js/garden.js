var NUM_BEDS = 20;

var VIEW_HEIGHT = 800;
var VIEW_WIDTH = 1200;

var voronoi =  new Voronoi();
var bbox, diagram;
var selected = false;

var pathToFlowerTypeMap = new Map();

class FlowerType {
    color;
    merosity = 5;
    whorls = 1;
    constructor(color) {
        this.color = color;
    }
    
    static randomType() {
        var flowerType = new FlowerType(randomFlowerColor());
        var merosity = [4, 5, 6];
        flowerType.merosity = merosity[Math.floor(Math.random()*merosity.length)];
        var whorls = [1, 1, 1, 2];
        flowerType.whorls = whorls[Math.floor(Math.random()*whorls.length)];
        return flowerType;
    }
}

function randomFlowerColor() {
    var hue = Math.random() * 240 + 180;
    var lightness = Math.random() * .4 + .4;
    return { hue: hue, saturation: 1, lightness: lightness };
}

class Bed {
    point;
    flowerType;
    
    constructor(point, flowerType) {
        this.point = point;
        this.flowerType = flowerType;    
    }
}

class Garden {
    bbox;
    beds = [];
    
    constructor(bbox, bedCount) {
        var bedPoints = generateRandomPoints(bbox, NUM_BEDS);
        console.log(bedPoints);
        for (var i = 0; i < bedPoints.length; i++) {
            this.beds.push(new Bed(bedPoints[i], FlowerType.randomType()));
        }
        this.bbox = bbox;
    }
    
    static init() {
        bbox = {
                xl: 0,
                xr: VIEW_WIDTH,
                yt: 0,
                yb: VIEW_HEIGHT
        };
        var garden = new Garden(bbox, NUM_BEDS);
        return garden;
    }
}

function generateRandomPoints(bbox, numPoints) {
    var points = [];
    var width = bbox.xr - bbox.xl;
    var height = bbox.yb - bbox.yt;
    for (var i = 0; i < numPoints; i++) {
        var x = Math.random() * width;
        var y = Math.random() * height;
        points.push({x: x, y: y});
    }
    return points;
}

function onResize() {
	var margin = 20;
	bbox = {
		xl: margin,
		xr: view.bounds.width - margin,
		yt: margin,
		yb: view.bounds.height - margin
	};
	for (var i = 0, l = sites.length; i < l; i++) {
		sites[i] = sites[i] * view.size / oldSize;
	}
	oldSize = view.size;
	renderDiagram();
}