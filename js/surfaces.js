var renderer;
var scene;
var stats;
var camera;
var controls;
var gui;
var dragControls;

var pointCloud = [];

// Globals params
var params = {
    gridSize: 4,
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function setupRendererAndStats()
{
    // Canvas setup
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Stats object
    stats = new Stats();
    document.body.appendChild(stats.dom);

    scene = new THREE.Scene();

    window.addEventListener( 'resize', onWindowResize, false );
}

function setupCamera()
{
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    controls = new THREE.OrbitControls( camera );
    controls.enableZoom = false;
}

function setupRaycaster()
{
    dragControls = new THREE.DragControls(pointCloud, camera, renderer.domElement);
    dragControls.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
    dragControls.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );
}

function setupGUI()
{
    gui = new dat.GUI({
        width: 200
    });

    gui.add(params, 'gridSize', 2, 10, 1).onChange(function(value) { 
        setupPoints(value);
        setupRaycaster();
     });
}

function createSinglePoint(x, y, z)
{
    var pointGeometry = new THREE.Geometry();
    pointGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    pointGeometry.computeBoundingBox();
    var pointMaterial = new THREE.PointsMaterial({size: 0.5, color: new THREE.Color(1, 1, 1) });
    var point = new THREE.Points(pointGeometry, pointMaterial);
    point.position.set(x, y, z);
    return point;
}

function setupPoints(gridSize)
{
    for(pt of pointCloud)
    {
        scene.remove(pt);
    }
    pointCloud = []
    for(var x = 0; x < gridSize; x++)
    {
        for(var y = 0; y < gridSize; y++)
        {
            var pt = createSinglePoint(x - gridSize / 2, y - gridSize / 2, 0);
            pointCloud.push(pt);
            scene.add(pt);
        }
    }
}

var lines = [];
function render()
{
    if (lines.length > 0)
    {
        for(let l of lines)
        {
            scene.remove(l);
        }
    }

    for(let i = 0; i < params.gridSize; i++)
    {
        let pts = [];
        for(let y = 0; y < params.gridSize; y++)
        {
            pts.push(pointCloud[i * params.gridSize + y].position);
        }
        var curve = new THREE.CatmullRomCurve3(pts);
        var p = curve.getPoints(50);
        var geometry = new THREE.BufferGeometry().setFromPoints(p);
        var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var line = new THREE.Line(geometry, material); 
        lines.push(line);
        scene.add(line);
    }

    for(let i = 0; i < params.gridSize; i++)
    {
        let pts = [];
        for(let y = 0; y < params.gridSize; y++)
        {
            pts.push(pointCloud[y * params.gridSize + i].position);
        }
        var curve = new THREE.CatmullRomCurve3(pts);
        var p = curve.getPoints(50);
        var geometry = new THREE.BufferGeometry().setFromPoints(p);
        var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var line = new THREE.Line(geometry, material); 
        lines.push(line);
        scene.add(line);
    }

    renderer.render( scene, camera );
}

function main()
{
    setupRendererAndStats();
    setupCamera();
    setupPoints(params.gridSize);
    setupRaycaster();
    setupGUI();

    function loop() {
        requestAnimationFrame( loop );

        controls.update();
        render();

        stats.update();
    }
    loop();
};

main();