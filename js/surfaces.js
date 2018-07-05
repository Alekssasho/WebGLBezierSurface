var renderer;
var scene;
var finalScene;
var stats;
var camera;
var controls;
var gui;
var dragControls;
var transformControl;

var pointCloud = [];

// Globals params
var params = {
    gridSize: 4,
    subdivisionCount: 4,
    wireframe: false,
    smooth: false,
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

    // Control poitns scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    var ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.7);
    scene.add(ambientLight);

    // Surface scene
    finalScene = new THREE.Scene();
    finalScene.background = new THREE.Color(0xf0f0f0);

    var ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.4);
    finalScene.add(ambientLight);

    // Common spot light
    var light = new THREE.SpotLight( 0xffffff, 0.7 );
    light.position.set( 0, 1500, 200 );

    finalScene.add(light);
    scene.add(light.clone());

    // grid helper
    var helper = new THREE.GridHelper( 60, 60 );
    helper.position.y = -5;

    finalScene.add(helper);

    helper = new THREE.GridHelper( 60, 60 );
    helper.position.y = -5;
    scene.add(helper);

    window.addEventListener( 'resize', onWindowResize, false );
}

function setupCamera()
{
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    controls = new THREE.OrbitControls(camera);
}

function setupRaycaster()
{
    dragControls = new THREE.DragControls(pointCloud, camera, renderer.domElement);
    dragControls.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
    dragControls.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );

    transformControl = new THREE.TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', render );
    scene.add( transformControl );
    transformControl.addEventListener( 'change', function( e ) {
        cancelHideTransorm();
    } );
    transformControl.addEventListener( 'mouseDown', function( e ) {
        cancelHideTransorm();
    } );
    transformControl.addEventListener( 'mouseUp', function( e ) {
        delayHideTransform();
    } );
    var dragcontrols = new THREE.DragControls( pointCloud, camera, renderer.domElement ); //
    dragcontrols.enabled = false;
    dragcontrols.addEventListener( 'hoveron', function ( event ) {
        transformControl.attach( event.object );
        cancelHideTransorm();
    } );
    dragcontrols.addEventListener( 'hoveroff', function ( event ) {
        delayHideTransform();
    } );
    var hiding;
    function delayHideTransform() {
        cancelHideTransorm();
        hideTransform();
    }
    function hideTransform() {
        hiding = setTimeout( function() {
            transformControl.detach( transformControl.object );
        }, 2500 )
    }
    function cancelHideTransorm() {
        if ( hiding ) clearTimeout( hiding );
    }
}

function setupGUI()
{
    gui = new dat.GUI({
        width: 200
    });

    var buttons = {
        resetPoints : function() {
            controls.update();
            transformControl.detach( transformControl.object );
            setupPoints(params.gridSize);
        }
    }

    gui.add(params, 'gridSize', 2, 10, 1).onChange(function(value) {
        controls.update();
        transformControl.detach( transformControl.object );
        setupPoints(value);
    });

    gui.add(params, 'subdivisionCount', 0, 20, 1);
    gui.add(params, "wireframe");
    gui.add(params, "smooth");
    gui.add(buttons, 'resetPoints');
}
var boxGeom = new THREE.BoxBufferGeometry(0.25, 0.25, 0.25);
function createSinglePoint(x, y, z)
{
    var material = new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } );
    var object = new THREE.Mesh( boxGeom, material );
    object.position.set(x, y, z);
    return object;
}

function setupPoints(gridSize)
{
    for(pt of pointCloud)
    {
        scene.remove(pt);
    }
    while(pointCloud.length > 0)
    {
        pointCloud.pop();
    }
    for(var x = 0; x < gridSize; x++)
    {
        for(var y = 0; y < gridSize; y++)
        {
            let xcoord = x - gridSize / 2;
            let ycoord =  y - gridSize / 2;
            var pt = createSinglePoint(xcoord, ycoord, (x * x - y * y) * (1 / gridSize));
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

    function getSurfacePoint(u, v) {
        function factorial(x) {
            let results = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
            if(x > results.length)
            {
                console.error("wrong factorial");
            }
            return results[x];
          }

        function calcB(i, param) {
            let gr = params.gridSize - 1;
            let a = factorial(gr) / (factorial(i) * factorial(gr - i));
            let b = Math.pow(param, i);
            let c = Math.pow(1 - param, gr - i);
            return a * b * c;
        }

        let result = new THREE.Vector3(0, 0, 0);
        for (let y = 0; y < params.gridSize; y++)
        {
            for (let x = 0; x < params.gridSize; x++)
            {
                let pt = pointCloud[y * params.gridSize + x].position.clone();
                let bu = calcB(x, u);
                let bv = calcB(y, v);
                pt.multiplyScalar(bu);
                pt.multiplyScalar(bv);
                result.add(pt);
            }
        }
        return result;
    }

    let geometry = new THREE.Geometry();
    let size = params.subdivisionCount + 2;
    for(let y = 0; y < size; y++)
    {
        for(let x = 0; x < size; x++)
        {
            let u = x / (size - 1);
            let v = y / (size - 1);
            geometry.vertices.push(getSurfacePoint(u, v));
        }
    }

    for(let y = 0; y < size - 1; y++)
    {
        for(let x = 0; x < size - 1; x++)
        {
            let v0 = y * size + x;
            let v1 = (y + 1) * size + x;
            let v2 = (y + 1) * size + x + 1;
            let v3 = y * size + x + 1;
            geometry.faces.push(new THREE.Face3(v0, v1, v2));
            geometry.faces.push(new THREE.Face3(v0, v2, v3));
        }
    }

    geometry.computeFaceNormals();
    if(params.smooth)
    {
        geometry.computeVertexNormals();
    }
    else
    {
        geometry.computeFlatVertexNormals();
    }

    let material;
    if(params.wireframe)
    {
        material = new THREE.MeshBasicMaterial({color: 0x000ff, side: THREE.DoubleSide, wireframe:true })
    }
    else
    {
        material = new THREE.MeshPhongMaterial({color: 0x00ff00, side: THREE.DoubleSide });
    }
    surface = new THREE.Mesh(geometry, material);
    finalScene.add(surface);
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
        transformControl.update();
        render();

        stats.update();
    }
    loop();
};

main();