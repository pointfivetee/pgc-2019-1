var FLOWER_SPACING = 35;
var PERLIN_STRENGTH = 25;
var GRASS_COLOR = "green";
var BED_COLOR = "green";
var PERIOD = 5;
var OFFSET = .4;
var CLUSTERING = .05;
var SEPARATION = 0;

var garden;
var pathsToBedsMap;

function renderGarden(garden) {
        // Use a random seed for the simplex noise generator
        noise.seed(Math.random());
            
	project.activeLayer.children = [];
        pathsToBedsMap = {}
        var beds = garden.beds;
        var bbox = garden.bbox;
        
        var background = new Shape.Rectangle(new Point(bbox.xl, bbox.yt), new Size(bbox.xr - bbox.xl, bbox.yb - bbox.yt));
        background.fillColor = GRASS_COLOR;
        
        var bedPoints = [];
        for (i = 0; i < beds.length; i++) {
            bedPoints.push(beds[i].point)
        }        
        console.log(bedPoints);
	var diagram = voronoi.compute(bedPoints, garden.bbox);
	if (diagram) {
                var bedGroup = new Group();
            
                // render all the flowerbeds
		for (var i = 0, l = bedPoints.length; i < l; i++) {
			var cell = diagram.cells[bedPoints[i].voronoiId];
			if (cell) {
				var halfedges = cell.halfedges,
					length = halfedges.length;
				if (length > 2) {
					var points = [];
					for (var j = 0; j < length; j++) {
						v = halfedges[j].getEndpoint();
						points.push(new Point(v));
					}
					var path = createPath(points, bedPoints[i]);
                                        bedGroup.addChild(path);
                                        pathsToBedsMap[path] = beds[i];
				}
			}
		}
                
                // add the flowers
                var flowerGroup = new Group();
                var flowerPoints = generateRegularPoints(bbox, FLOWER_SPACING);
                for (var i = 0, l = flowerPoints.length; i < l; i++) {
                    var point = flowerPoints[i];
                    var hitResult = bedGroup.hitTest(point, {
                        fill: true,
                        stroke: true,
                        segments: true,
                        tolerance: settings.hitTolerance,
                        class: Path});
                    
                    if (hitResult) {
                        // Use simplex noise to perturb the flowers
                        point += new Point(
                            noise.simplex2(point.x / PERIOD, point.y / PERIOD),
                            noise.simplex2((point.x + OFFSET) / PERIOD, point.y / PERIOD)) * PERLIN_STRENGTH;
                        point += new Point(
                            noise.simplex2(point.x / (PERIOD/2), point.y / (PERIOD/2)),
                            noise.simplex2((point.x + OFFSET) / (PERIOD/2), point.y / (PERIOD/2))) * PERLIN_STRENGTH / 2;
                            
                        // Cluster points towards origin point of bed
                        point = point + (new Point(pathsToBedsMap[hitResult.item].point) - point) * CLUSTERING;
                        //var flower = new Path.Circle(point, 10);
                        //flower.fillColor = pathsToBedsMap[hitResult.item].flowerType.color;
                        //flower.strokeColor = {hue: flower.fillColor.hue, saturation: flower.fillColor.saturation, brightness: flower.fillColor.brightness * .75};
                        var flower = renderFlower(point, pathsToBedsMap[hitResult.item].flowerType);
                        flowerGroup.addChild(flower);
                    }
                }
        }
}


function createPath(points, center) {
	var path = new Path();
	path.fillColor = BED_COLOR;
	path.closed = true;

	for (var i = 0, l = points.length; i < l; i++) {
		var point = points[i];
		var next = points[(i + 1) == points.length ? 0 : i + 1];
		var vector = (next - point) / 2;
		path.add({
			point: point + vector,
			handleIn: -vector,
			handleOut: vector
		});
	}
	path.scale(0.98);
	removeSmallBits(path);
	return path;
}

function removeSmallBits(path) {
	var averageLength = path.length / path.segments.length;
	var min = path.length / 50;
	for(var i = path.segments.length - 1; i >= 0; i--) {
		var segment = path.segments[i];
		var cur = segment.point;
		var nextSegment = segment.next;
		var next = nextSegment.point + nextSegment.handleIn;
		if (cur.getDistance(next) < min) {
			segment.remove();
		}
	}
}

function generateRegularPoints(bbox, spacing) {
    var points = [];
    var width = bbox.xr - bbox.xl;
    var height = bbox.yb - bbox.yt;
    for (var x = bbox.xl + spacing / 2; x < bbox.xr - spacing / 2; x += spacing) {
        for (var y = bbox.yt + spacing / 2; y < bbox.yb - spacing / 2; y += spacing) {
            points.push(new Point(x, y));
        }
    }
    return points;
}

function generateRegulaHexrPoints(bbox, spacing) {
    var points = [];
    var width = bbox.xr - bbox.xl;
    var height = bbox.yb - bbox.yt;
    var evenRow = true;
    for (var y = bbox.yt + spacing / 2; y < bbox.yb - spacing / 2; y += spacing) {
        for (var x = bbox.xl + spacing / 2; x < bbox.xr - spacing / 2; x += spacing) {
            if (evenRow ){
                points.push(new Point(x, y));
            } else {
                points.push(new Point(x + spacing / 2, y));
            }
        }
        evenRow = !evenRow;
    }
    return points;
}

function renderFlower(point, flowerType) {
    var flower = new Group();
    var numPetals = flowerType.merosity;
    var petalAngle = 360.0 / numPetals;
    for (var w = 0; w < flowerType.whorls; w++)  {
        for (var i = 0; i < numPetals; i++) {
            var petalPath = new Path();
            petalPath.fillColor = flowerType.color;
            petalPath.strokeColor = {hue: petalPath.fillColor.hue, saturation: petalPath.fillColor.saturation, brightness: petalPath.fillColor.brightness * .75};
            petalPath.closed = true;
            
            petalPath.add({
                point: point,
                handleIn: {length: 35, angle: 0},
                handleOut: {length: 35, angle: petalAngle}
            });
            
            petalPath.rotate(petalAngle * i + w * petalAngle / flowerType.whorls, point);
            
            flower.addChild(petalPath);
        }
    }
    
    // randomly rotate and scale the flower to make them look less uniform
    flower.rotate(Math.random() * 360, point);
    flower.scale(Math.random() * .4 + .8);
    return flower;
}

function onMouseUp(event) {
    garden = Garden.init();
    renderGarden(garden);
}

garden = Garden.init();
renderGarden(garden);