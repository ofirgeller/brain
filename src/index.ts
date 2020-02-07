import { SVG, Circle, Path } from '@svgdotjs/svg.js';
import colors from './colors';
import poissonDiscSampler from './poissonDiscSampler';
import idGenerator from './idGenerator';

// TODO: 
// make the impulses bigger and have nicer colors
// the neurons bigger and more complex
// make axon have a visual direction
// make neuron randomly emit impulses(?)
// make the axon more curve.

var draw = SVG().addTo('#container').size(600, 600);

interface IPoint {
    x: number;
    y: number;
}

class Pos implements IPoint {
    constructor(public x: number, public y: number) {
    }
}

var neurons: Neuron[] = [];
var axons: Axon[] = [];

var config = {
    bgColor: '#0D0D0D',
    axonStroke: '#8e8e8e',// '#1E1E1E',
    neuronCount: 50,
    axonCount: 50,
    axonStrokeWidth: 1
}

class Neuron {

    private static nextId = idGenerator();

    id: number;
    inputAxons: Axon[] = [];
    outputAxons: Axon[] = [];
    elm: Circle;

    constructor(public pos: IPoint, public size = 1) {

        this.id = Neuron.nextId();

        this.elm = draw.circle(size)
            .move(pos.x, pos.y)
            .attr({
                fill: colors.LighterGray,
                stroke: colors.Charcoal,
                strokeWidth: 1
            });
            
        this.elm.click((e: MouseEvent) => {
            this.outputAxons.forEach(a => a.fire());
        });

    }

    onPoke() {
        this.outputAxons.forEach(a => {
            var shouldFire = Math.random() > 0.5;
            if (shouldFire) {
                a.fire();
            }
        });
    }
}

class Axon {

    private static nextId = idGenerator();

    id: number;
    startNeuron: Neuron;
    endNeuron: Neuron;
    elm: Path;
    pathPoints: IPoint[];

    constructor(public first: Neuron, public second: Neuron) {

        this.id = Axon.nextId();

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

        this.elm = draw.path('M ' + startPoint + ' C ' + startPoint + ', ' + ctrlPoint + ', ' + endPoint);
        this.addAttrib(this.elm);

        this.pathPoints = getPointsOnPath(this.elm);
    }

    addAttrib(elm: Path) {
        elm.attr({
            fill: 'none',
            stroke: config.axonStroke,
            strokeWidth: config.axonStrokeWidth,
            'z-index': -1,
        }).addClass('.no-click');
    }

    fire() {
        var idx = 0;
        var point = this.pathPoints[idx];
        var impulse: Circle;

        var interval = setInterval(() => {

            if (!impulse) {
                impulse = draw.circle(5)
                    .move(point.x, point.y)
                    .attr({ fill: colors.Orange, stroke: '#00ce68' });
            }

            idx++;
            point = this.pathPoints[idx];
            if (point) {
                impulse.animate(90).move(point.x, point.y);
            } else {
                clearInterval(interval);
                impulse.remove();
                this.endNeuron.onPoke();
            }
        }, 100)

    }
}

function getPointsOnPath(path: Path, numberOfPoints = 10) {

    if (path.type !== 'path') {
        throw new Error('getPointsOnPath was passed a none path snap element ' + path.type);
    }

    var points: IPoint[] = [];

    var length = path.length();
    var lengthInc = length / numberOfPoints;
    var runningLength = -lengthInc;
    for (var i = 0; i < numberOfPoints; i++) {
        runningLength = runningLength + lengthInc;
        points.push(path.pointAt(runningLength));
    }

    return points;
}

draw.attr({ fill: config });

const MARGIN = 30; 
var samples = poissonDiscSampler(draw.width() - MARGIN, draw.height() - MARGIN, 65);

for (var j = 0; j < config.neuronCount; j++) {
    var sample = samples();
    if (!sample || !sample[0]) {
        break;
    }

    var size = Math.ceil(Math.random() * 2) + 6;
    var neuron = new Neuron(new Pos(sample[0] + MARGIN / 2, sample[1] + MARGIN / 2), size);
    neurons.push(neuron);
}


// try to connect to the closest neurons.
// avoid cyclic a=> b, b=>a
for (var j = 0; j < neurons.length; j++) {

    var startNeuron = neurons[j];
    var connections = 0;
    var options = findNClosestNeurons(j, 4);

    for (var i = 0; i < options.length && connections < 2; i++) {

        var second = options[i].neuron;
        if (!second.outputAxons.some(a => a.endNeuron.id === startNeuron.id)) {
            var axon = new Axon(startNeuron, second);
            axons.push(axon);
            connections++;
        }
    }
}


function findNClosestNeurons(index: number, n: number) {
    var base = neurons[index];

    var options = neurons.filter(i => i.id !== base.id)
        .map((i, idx) => {
            return { neuron: i, distance: distance(i.pos, base.pos) };
        }).sort((a, b) => a.distance - b.distance)
        .slice(0, n);

    return options;
}

function distance(p1: IPoint, p2: IPoint) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

