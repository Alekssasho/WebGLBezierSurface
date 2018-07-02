var renderer;
var scene;
var finalScene;
var stats;
var camera;
var controls;
var gui;
var dragControls;

var pointCloud = [];

// Globals params
var params = {
    gridSize: 4,
    subdivisionCount: 1,
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
    scene.background = new THREE.Color(0x001111);
    finalScene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    finalScene.add(ambientLight);

    light = new THREE.PointLight(0xffffff, 0.6);
    light.position.set(0, 0, 5);
    finalScene.add(light);
    finalScene.background = new THREE.Color(0x110011);

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

    var buttons = {
        resetPoints : function() {
            setupPoints(params.gridSize);
            setupRaycaster();
        }
    }

    gui.add(params, 'gridSize', 2, 10, 1).onChange(function(value) { 
        setupPoints(value);
        setupRaycaster();
    });

    gui.add(params, 'subdivisionCount', 1, 10, 1).onChange(function(value) {
        // TODO:
    });

    gui.add(buttons, 'resetPoints');
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

var lines = null;
function setupLinesBetweenPoints()
{
    if (lines != null)
    {
        scene.remove(lines);
    }

    let pts = [];
    for(let y = 0; y < params.gridSize; y++)
    {
        for(let x = 0; x < params.gridSize - 1; x++)
        {
            pts.push(pointCloud[y * params.gridSize + x].position);
            pts.push(pointCloud[y * params.gridSize + x + 1].position);
        }
    }

    for(let x = 0; x < params.gridSize; x++)
    {
        for(let y = 0; y < params.gridSize - 1; y++)
        {
            pts.push(pointCloud[y * params.gridSize + x].position);
            pts.push(pointCloud[(y + 1) * params.gridSize + x].position);
        }
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(pts);
    var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);
}

var surface = null;
function setupSurface()
{
    if(surface != null)
    {
        finalScene.remove(surface);
    }

    let size = params.gridSize * params.subdivisionCount;

    function getSurfacePoint(u, v, target) {
        var x = Math.floor(u * (size - 1));
        var y = Math.floor(v * (size - 1));
        var x1 = Math.ceil(u * (size - 1));
        var y1 = Math.ceil(v * (size - 1));
        var pos = pointCloud[y * params.gridSize + x].position;
        var pos1 = pointCloud[y1 * params.gridSize + x1].position;
        var result = new THREE.Vector3();
        target.set(
            THREE.Math.lerp(pos.x, pos1.x, x1 - u * (size - 1)),
            THREE.Math.lerp(pos.y, pos1.y, y1 - v * (size - 1)),
            pos.z);
    }

    let geometry = new THREE.ParametricGeometry(getSurfacePoint, size - 1, size - 1);
    let material = new THREE.MeshPhongMaterial({color: 0x00ff00, side: THREE.DoubleSide });
    surface = new THREE.Mesh(geometry, material);
    finalScene.add(surface);

    light.target = surface;
}

function render()
{
    setupLinesBetweenPoints();
    setupSurface();

    renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render( scene, camera );

    renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render( finalScene, camera );
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