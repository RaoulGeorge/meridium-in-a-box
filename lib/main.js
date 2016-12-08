/*============Properties div accordion=======================*/

var graph = new joint.dia.Graph;

// Create a paper and wrap it in a PaperScroller.
// ----------------------------------------------

var paperScroller = new joint.ui.PaperScroller({
    autoResizePaper: true
});

var paper = new joint.dia.Paper({

    el: paperScroller.el,
    width: 1100,
    height: 700,
    gridSize: 10,
    perpendicularLinks: true,
    model: graph,
    defaultLink: new joint.dia.Link({
        attrs: {
            // @TODO: scale(0) fails in Firefox
            '.marker-source': { d: 'M 10 0 L 0 5 L 10 10 z', transform: 'scale(0.001)' },
            '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }
        }
    })
});
paperScroller.options.paper = paper;

$('#paper').append(paperScroller.render().el);
paperScroller.center();

// Create and populate stencil.
// ----------------------------

var stencil = new joint.ui.Stencil({ graph: graph, paper: paper, width: 200, height: 380 });
$('#stencil').append(stencil.render().el);

var m = new joint.shapes.devs.Model({
    position: { x: 20, y: 20 },
    size: { width: 70, height: 30 },
    inPorts: [''],
    outPorts: [''],
    attrs: {
        rect: { width: 50, height: 30, fill: '#DCE6F2', stroke: '#4A7EBB' },
        '.label': { text: 'Process2', fill: 'black', 'font-size': 12, 'ref-x': 15, 'ref-y': 13},
        '.inPorts circle, .outPorts circle': { fill: 'black', opacity: 0.9, r: 4, stroke: '#4A7EBB' },
    }
});

var m1 = new joint.shapes.devs.Model({
    position: { x: 115, y: 20 },
    size: { width: 70, height: 30 },
    inPorts: [''],
    outPorts: [''],
    attrs: {
        rect: { width: 50, height: 30, fill: '#DCE6F2', stroke: '#4A7EBB' },
        '.label': { text: 'Process', fill: 'black', 'font-size': 12, 'ref-x': 15, 'ref-y': 13 },
        '.inPorts circle, .outPorts circle': { fill: 'black', opacity: 0.9, r: 4, stroke: '#4A7EBB' },
    }
});
var c = new joint.shapes.basic.Circle({
    position: { x: 20, y: 60 },
    size: { width: 70, height: 30 },
    inPorts: [''],
    outPorts: [''],
    attrs: {
        circle: { width: 50, height: 30, fill: '#DCE6F2', stroke: '#4A7EBB' },
        text: { text: 'ellipse', fill: 'black', 'font-size': 10 },
        '.inPorts circle, .outPorts circle': { fill: 'black', opacity: 0.9, r: 4 },
        '.inPorts text, .outPorts text': { 'font-size': 9 },
    }
});
stencil.load([m, m1, c]);


// Selection.
// ----------

var selection = new Backbone.Collection;

var selectionView = new joint.ui.SelectionView({
    paper: paper,
    graph: graph,
    model: selection
});


// Initiate selecting when the user grabs the blank area of the paper while the Shift key is pressed.
// Otherwise, initiate paper pan.
paper.on('blank:pointerdown', function(evt, x, y) {

    if (_.contains(KeyboardJS.activeKeys(), 'shift')) {
        selectionView.startSelecting(evt, x, y);
    } else {
        paperScroller.startPanning(evt, x, y);
    }
});

paper.on('cell:pointerdown', function(cellView, evt) {
    // Select an element if CTRL/Meta key is pressed while the element is clicked.
    if ((evt.ctrlKey || evt.metaKey) && !(cellView.model instanceof joint.dia.Link)) {
        selectionView.createSelectionBox(cellView);
        selection.add(cellView.model);
    }
});

selectionView.on('selection-box:pointerdown', function(evt) {
    // Unselect an element if the CTRL/Meta key is pressed while a selected element is clicked.
    if (evt.ctrlKey || evt.metaKey) {
        var cell = selection.get($(evt.target).data('model'));
        selectionView.destroySelectionBox(paper.findViewByModel(cell));
        selection.reset(selection.without(cell));
    }
});

/*===========Context menu=======================
paper.on('cell:pointerdown',
    function (cellView, evt, x, y) {
        alert('cell view ' + cellView.model.id + ' was clicked');
        $('.viewport').mousedown(function () {
            oncontextmenu = ShowMenu('contextMenu',event);
        });
    }
);




function ShowMenu(control, e) {
    var posx = e.clientX + window.pageXOffset + 'px'; //Left Position of Mouse Pointer
    var posy = e.clientY + window.pageYOffset + 'px'; //Top Position of Mouse Pointer
    document.getElementById(control).style.position = 'absolute';
    document.getElementById(control).style.display = 'inline';
    document.getElementById(control).style.left = posx;
    document.getElementById(control).style.top = posy;
}
function HideMenu(control) {

    document.getElementById(control).style.display = 'none';
}

/*===============================================================*/



$('.viewport').on('click', function (e) {
    //alert(e.target.id);
    $("#active_event").focus();
    $("#active_event").val(e.target.id);
    $(".halo .remove").css('display', 'block');
});
// Disable context menu inside the paper.
// This prevents from context menu being shown when selecting individual elements with Ctrl in OS X.
paper.el.oncontextmenu = function(evt) { evt.preventDefault(); };


// An example of a simple element editor.
// --------------------------------------

var elementInspector = new ElementInspector();
$('.inspector').append(elementInspector.el);

// Halo - element tools.
// ---------------------

paper.on('cell:pointerup', function(cellView, evt) {

    if (cellView.model instanceof joint.dia.Link || selection.contains(cellView.model)) return;
    
    var halo = new joint.ui.Halo({
        graph: graph,
        paper: paper,
        cellView: cellView
    });

    halo.render();
    elementInspector.render(cellView);
});


// Clipboard.
// ----------

var clipboard = new joint.ui.Clipboard;
KeyboardJS.on('ctrl + c', function() {
    // Copy all selected elements and their associated links.
    clipboard.copyElements(selection, graph, { translate: { dx: 20, dy: 20 }, useLocalStorage: true });
});
KeyboardJS.on('ctrl + v', function() {
    clipboard.pasteCells(graph);

    selectionView.cancelSelection();

    clipboard.pasteCells(graph, { link: { z: -1 }, useLocalStorage: true });

    // Make sure pasted elements get selected immediately. This makes the UX better as
    // the user can immediately manipulate the pasted elements.
    var selectionTmp = [];
        
    clipboard.each(function(cell) {

        if (cell.get('type') === 'link') return;

        // Push to the selection not to the model from the clipboard but put the model into the graph.
        // Note that they are different models. There is no views associated with the models
        // in clipboard.
        selectionTmp.push(graph.get('cells').get(cell.id));
        
        selectionView.createSelectionBox(paper.findViewByModel(cell));
    });

    selection.reset(selectionTmp);
});

// Command Manager - undo/redo.
// ----------------------------

var commandManager = new joint.dia.CommandManager({ graph: graph });

// Validator
// ---------

var validator = new joint.dia.Validator({ commandManager: commandManager });

validator.validate('change:position change:size add', function (err, command, next) {

    if (command.action === 'add' && command.batch) return next();

    var cell = command.data.attributes || graph.getCell(command.data.id).toJSON();
    var area = g.rect(cell.position.x, cell.position.y, cell.size.width, cell.size.height);

    if (_.find(graph.getElements(), function (e) {

	var position = e.get('position'), size = e.get('size');
	return (e.id !== cell.id && area.intersect(g.rect(position.x, position.y, size.width, size.height)));

    })) return next("Another cell in the way!");
});

validator.on('invalid',function(message) {
    $('#message').text(message).fadeIn(0).delay(1500).fadeOut(0);
});

// Hook on toolbar buttons.
// ------------------------

$('#btn-undo').on('click', _.bind(commandManager.undo, commandManager));
$('#btn-redo').on('click', _.bind(commandManager.redo, commandManager));
$('#btn-clear').on('click', _.bind(graph.clear, graph));
$('#btn-svg').on('click', function() {
    paper.openAsSVG();
    console.log(paper.toSVG()); // An exmaple of retriving the paper SVG as a string.
});

var zoomLevel = 1;

function zoom(paper, newZoomLevel) {

    if (newZoomLevel > 0.2 && newZoomLevel < 20) {

	var ox = (paper.el.scrollLeft + paper.el.clientWidth / 2) / zoomLevel;
	var oy = (paper.el.scrollTop + paper.el.clientHeight / 2) / zoomLevel;

	paper.scale(newZoomLevel, newZoomLevel, ox, oy);

	zoomLevel = newZoomLevel;
    }
}

$('#btn-zoom-in').on('click', function() { zoom(paper, zoomLevel + 0.2); });
$('#btn-zoom-out').on('click', function() { zoom(paper, zoomLevel - 0.2); });

// Force-Directed graph layout example.
// ------------------------------------

//graph.on('add remove change:source change:target', layout);
$('#btn-layout').on('click', layout);

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 60);
};
window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 60);
};


var animateFrameRequestID;

function layout() {

    if (animateFrameRequestID) {
        cancelAnimationFrame(animateFrameRequestID);
    }
    
    $('#layout').empty();

    if (graph.get('cells').length === 0) {
        // There is nothing to layout.
        return;
    }
    
    var graphClone = new joint.dia.Graph;

    // This is the view (paper) for our layouted graph.
    var paperClone = new joint.dia.Paper({
        el: $('#layout'),
        width: 240,
        height: 105,
        gridSize: 1,
        model: graphClone,
        linkView: LightLinkView // See the ./LightLinkView.js file.
    });
    paperClone.scale(.8, .8);
    paperClone.$el.css('pointer-events', 'none');

    // Load our cloned graph with the same cells as are in the original graph.
    graphClone.fromJSON(JSON.parse(JSON.stringify(graph.toJSON())));

    // Filter out links that are not connected on both sides, remove vertices from links
    // and put them always to the back (z === -1).
    _.each(graphClone.getLinks(), function(link) {
        if (!link.get('source').id || !link.get('target').id) {
            link.remove();
        } else {
            link.set({ vertices: [], z: -1 });
        }
    });

    // Make elements a little bit smaller.
    _.each(graphClone.getElements(), function(element) {
        var size = element.get('size');
        element.resize(size.width/3, size.height/3);
        element.attr({ text: { 'font-size': 6 }  });
    });
    
    // Force-directed layout initialization.
    var graphLayout = new joint.layout.ForceDirected({
        graph: graphClone,
        width: 240,
        height: 100,
        charge: 780,
        linkStrength: .5,
        linkDistance: 30,
        gravityCenter: { x: 105, y: 50 }
    });

    graphLayout.start();

    function animate() {
        animateFrameRequestID = requestAnimationFrame(animate);
        graphLayout.step();
    }
    animate();
}

