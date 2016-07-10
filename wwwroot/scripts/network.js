// make the impulses bigger and have nicer colors
// the neurons bigger and more complex
// make axon have a visual direction
// make neuron randomly emit impulses(?)
// make the axon more curve.
var Pos = (function () {
    function Pos(x, y) {
        this.x = x;
        this.y = y;
    }
    return Pos;
}());
var neurons = [];
var axons = [];
var config = {
    bgColor: '#0D0D0D',
    axonStroke: '#8e8e8e',
    neuronCount: 55,
    axonCount: 10,
    axonStrokeWidth: 1
};
var nextId = function (seed) {
    if (seed === void 0) { seed = 0; }
    return function () {
        var nextId = seed;
        seed++;
        return nextId;
    };
}();
var Neuron = (function () {
    function Neuron(pos, size) {
        var _this = this;
        if (size === void 0) { size = 1; }
        this.pos = pos;
        this.size = size;
        this.inputAxons = [];
        this.outputAxons = [];
        this.id = nextId();
        this.elm = ctx.circle(pos.x, pos.y, size).attr({
            fill: colors.LighterGray,
            stroke: colors.Charcoal,
            strokeWidth: 1
        });
        this.elm.click(function (e) {
            _this.outputAxons.forEach(function (a) { return a.fire(); });
        });
    }
    Neuron.prototype.poke = function () {
        this.outputAxons.forEach(function (a) {
            var shouldFire = Math.round(Math.random());
            if (shouldFire)
                a.fire();
        });
    };
    return Neuron;
}());
var Axon = (function () {
    function Axon(first, second) {
        this.first = first;
        this.second = second;
        this.id = nextId();
        this.startNeuron = first;
        this.endNeuron = second;
        this.startNeuron.outputAxons.push(this);
        this.endNeuron.inputAxons.push(this);
        var curveBoost = Math.ceil(Math.random() * 20) + 10;
        var curveSign = [1, -1][Math.round(Math.random() * 1)];
        var curve = curveBoost * curveSign;
        var startPoint = first.pos.x + ' ' + first.pos.y;
        var endPoint = second.pos.x + ' ' + second.pos.y;
        var midX = (first.pos.x + second.pos.x) / 2;
        var midY = (first.pos.y + second.pos.y) / 2;
        var ctrlPoint = (midX + curve) + ' ' + (midY + curve);
        //var p1 =  ;
        //var p2 =  first.pos.x + (first.pos.x - second.pos.x) ;
        //var p3 = ;
        //this.elmBase = ctx.polygon(',  ,  ,');
        this.elm = ctx.path('M ' + startPoint + ' C ' + startPoint + ', ' + ctrlPoint + ', ' + endPoint);
        this.addAttrib(this.elm);
        this.pathPoints = getPointsOnPath(this.elm);
    }
    Axon.prototype.addAttrib = function (elm) {
        elm.attr({
            fill: 'none',
            stroke: config.axonStroke,
            strokeWidth: config.axonStrokeWidth,
            'z-index': -1,
        }).addClass('.no-click');
    };
    Axon.prototype.fire = function () {
        var _this = this;
        var idx = 0;
        var point = this.pathPoints[idx];
        var impulse;
        var interval = setInterval(function () {
            if (!impulse) {
                impulse = ctx.circle(point.x, point.y, 3)
                    .attr({ fill: colors.Orange, stroke: '#00ce68' });
            }
            idx++;
            point = _this.pathPoints[idx];
            if (point) {
                impulse.animate({ cx: point.x, cy: point.y }, 90);
            }
            else {
                clearInterval(interval);
                impulse.remove();
                _this.endNeuron.poke();
            }
        }, 100);
    };
    return Axon;
}());
function getPointsOnPath(path) {
    var numberOfPoints = 10;
    var points = [];
    var length = path.getTotalLength();
    var lengthInc = length / numberOfPoints;
    var runningLength = -lengthInc;
    for (var i = 0; i < numberOfPoints; i++) {
        runningLength = runningLength + lengthInc;
        points.push(path.getPointAtLength(runningLength));
    }
    return points;
}
var jSvg = $('#network');
var svg = jSvg.get(0);
var ctx = Snap(svg);
ctx.attr({ fill: config });
var samples = poissonDiscSampler(jSvg.width(), jSvg.height(), 65);
for (var j = 0; j < config.neuronCount; j++) {
    var sample = samples();
    if (!sample || !sample[0]) {
        break;
    }
    var size = Math.ceil(Math.random() * 2) + 3;
    var neuron = new Neuron(new Pos(sample[0], sample[1]), size);
    neurons.push(neuron);
}
// try to connect to the closest neurons.
// avoid cyclic a=> b, b=>a
for (var j = 0; j < neurons.length; j++) {
    var first = neurons[j];
    var connections = 0;
    var options = findNClosestNeurons(j, 4);
    for (var i = 0; i < options.length && connections < 2; i++) {
        var second = neurons[options[i].idx];
        if (!second.outputAxons.some(function (a) { return a.endNeuron.id === first.id; })) {
            var axon = new Axon(first, second);
            axons.push(axon);
            connections++;
        }
    }
}
function findNClosestNeurons(index, n) {
    var base = neurons[index];
    var options = neurons.filter(function (i) { return i.id !== base.id; })
        .map(function (i, idx, arr) {
        return { idx: idx, distance: distance(i.pos, base.pos) };
    }).sort(function (a, b) { return a.distance - b.distance; })
        .filter(function (i, idx) { return idx < n; });
    return options;
}
function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
function pointsAsString(points) {
    points.map(function (p) { return p.x + ',' + p.y + ' '; }).join('');
}
