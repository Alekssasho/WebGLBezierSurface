var renderer;
var scene;
var stats;
var camera;
var controls;
var dragControls;

var pointCloud = [];

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
    camera.position.z = 15;
    controls = new THREE.OrbitControls( camera );
    controls.enableZoom = false;
}

function setupRaycaster()
{
    dragControls = new THREE.DragControls(pointCloud, camera, renderer.domElement);
    dragControls.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
    dragControls.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );
}

function setupPoints() 
{
    var points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(1, 1, 0)
    ];

    for(var i = 0; i < points.length; i++)
    {
        var pointGeometry = new THREE.Geometry();
        pointGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        pointGeometry.computeBoundingBox();
        var pointMaterial = new THREE.PointsMaterial({size: 0.5, color: new THREE.Color(1, 1, 1) });
        var point = new THREE.Points(pointGeometry, pointMaterial);
        point.position.set(points[i].x, points[i].y, points[i].z);

        pointCloud.push(point);
        scene.add(point);
    }
}


var line = null;
function render()
{
    if (line != null)
    {
        scene.remove(line);
    }

    var curve = new THREE.CubicBezierCurve3(
        pointCloud[0].position,
        pointCloud[1].position,
        pointCloud[2].position,
        pointCloud[3].position
    );
    var p = curve.getPoints(50);
    var geometry = new THREE.BufferGeometry().setFromPoints(p);
    var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    line = new THREE.Line(geometry, material);
    scene.add(line);

    renderer.render( scene, camera );
}

function main()
{
    setupRendererAndStats();
    setupCamera();
    setupPoints();
    setupRaycaster();

    function loop() {
        requestAnimationFrame( loop );

        controls.update();
        render();

        stats.update();
    }
    loop();
};

main();