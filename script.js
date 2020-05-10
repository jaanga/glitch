
aSource.href = "https://github.com/zzzzz/xxxxx.html";

svgOcticon = `<svg height="18" class="octicon" viewBox="0 0 16 16" version="1.1" width="18" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>`;
aSource.innerHTML = svgOcticon;


sTitle.innerHTML= document.title ? document.title : location.href.split( '/' ).pop().slice( 0, - 5 ).replace( /-/g, ' ' );
const version = document.head.querySelector( "[ name=version ]" );
sVersion.innerHTML = version ? version.content : "";
divDescription.innerHTML = document.head.querySelector( "[ name=description ]" ).content;


let mesh, group, axesHelper, lightDirectional, cameraHelper;
let sceneRotation = 1;
let renderer, camera, controls, scene;

init();
animate();



function init() {

	camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( - 100, - 100, 100 );
	camera.up.set( 0, 0, 1 );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xcce0ff );
	//scene.fog = new THREE.Fog( 0xcce0ff, 550, 800 );
	scene.add( camera )

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.maxDistance = 500;
	controls.rotateSpeed = 5;
	//controls.maxPolarAngle = Math.PI * 0.5;


	window.addEventListener( 'resize', onWindowResize, false );
	window.addEventListener( 'orientationchange', onWindowResize, false );
	window.addEventListener( 'keyup', () => sceneRotation = 0, false );
	renderer.domElement.addEventListener( 'click', () => sceneRotation = 0, false );

	addLights();

	axesHelper = new THREE.AxesHelper( 100 );
	scene.add( axesHelper );

	addGround();

	//addMesh();

	addMeshes();

	zoomObjectBoundingSphere();


}




function addLights() {

	//scene.add( new THREE.AmbientLight( 0x404040 ) );
	scene.add( new THREE.AmbientLight( 0x666666 ) );

	const pointLight = new THREE.PointLight( 0xffffff, 0.2 );
	pointLight.position.copy( camera.position );
	camera.add( pointLight );

	lightDirectional = new THREE.DirectionalLight( 0xdffffff, 0.5 );
	lightDirectional.position.set( -50, -200, 100 );
	lightDirectional.castShadow = true;
	lightDirectional.shadow.mapSize.width = 1024;
	lightDirectional.shadow.mapSize.height = 1024;

	var d = 100;
	lightDirectional.shadow.camera.left = - d;
	lightDirectional.shadow.camera.right = d;
	lightDirectional.shadow.camera.top = d;
	lightDirectional.shadow.camera.bottom = - d;
	lightDirectional.shadow.camera.far = 500;
	scene.add( lightDirectional );

	scene.add( new THREE.CameraHelper( lightDirectional.shadow.camera ) );

}



function addGround() {

	const geometry = new THREE.PlaneBufferGeometry( 2000, 2000 );
	const material = new THREE.MeshPhongMaterial( { color: 0xaaaaaa, depthWrite: false, side: 2 } );
	const mesh = new THREE.Mesh( geometry, material );
	mesh.position.z = -50;
	mesh.receiveShadow = true;
	scene.add( mesh );

}



function zoomObjectBoundingSphere( obj = group ) {
	//console.log( "obj", obj );

	center = new THREE.Vector3( 0, 0, 0 );
	radius=  50;

	const bbox = new THREE.Box3().setFromObject( obj );
	//console.log( 'bbox', bbox );

	if ( bbox.max.x !== Infinity ) {

		const sphere = bbox.getBoundingSphere( new THREE.Sphere() );

		center = sphere.center;
		radius = sphere.radius;
		//console.log( "sphere", sphere )
	}

	controls.target.copy( center ); // needed because model may be far from origin
	controls.maxDistance = 50 * radius;

	delta = camera.position.clone().sub( controls.target ).normalize();
	//console.log( 'delta', delta );

	position = controls.target.clone().add( delta.multiplyScalar( 2 * radius ) );
	//console.log( 'position', position );

	distance = controls.target.distanceTo( camera.position );

	//camera.zoom = distance / (  * radius ) ;

	camera.position.copy( center.clone().add( new THREE.Vector3( -2 * radius, 2 * radius, 1.0 * radius ) ) );
	camera.near = 0.001 * radius; //2 * camera.position.length();
	camera.far = 50 * radius; //2 * camera.position.length();
	camera.updateProjectionMatrix();

	axesHelper.position.copy( center );

	if ( lightDirectional ) {

		lightDirectional.position.copy( center.clone().add( new THREE.Vector3( -1.5 * radius, 1.5 * radius, 1.5 * radius ) ) );
		lightDirectional.shadow.camera.scale.set( 0.02 * radius, 0.02 * radius, 0.2 * radius );

		//targetObject.position.copy( center );

		scene.remove( cameraHelper );
		cameraHelper = new THREE.CameraHelper( lightDirectional.shadow.camera );
		scene.add( cameraHelper );

	}

	let event = new Event( "onresetthree", {"bubbles": true, "cancelable": false, detail: true } );

	//window.addEventListener( "onrresetthree", doThings, false );

	// listening: or-object-rotation-xx.js
	// listening: dss-display-scene-settings-xx.js

	window.dispatchEvent( event );

};



function addMesh( size = 20 ) {

	// CylinderGeometry( radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded )
	// SphereGeometry( radius, segmentsWidth, segmentsHeight, phiStart, phiLength, thetaStart, thetaLength )
	// TorusGeometry( radius, tube, radialSegments, tubularSegments, arc )

	const geometry = new THREE.BoxGeometry( size, size, size );

	geometry.applyMatrix4( new THREE.Matrix4().makeRotationX( -0.5 * Math.PI ) );
	geometry.applyMatrix4( new THREE.Matrix4().makeScale( 1, 1, 1 ) );
	geometry.applyMatrix4( new THREE.Matrix4().makeTranslation( 0, 0, 0 ) );

	//const material = new THREE.MeshNormalMaterial();
	const material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random(), specular: 0xffffff } );
	mesh = new THREE.Mesh( geometry, material );
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

	return mesh;

}



function addMeshes( count = 100 ) {

	scene.remove( group );

	group = new THREE.Group();

	for ( let i = 0; i < count; i++ ) { group.add( addMesh() ) };

	group.children.forEach( mesh => {
		mesh.position.set( Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50 )
		mesh.rotation.set( 0.2 * Math.random(), 0.2 * Math.random(), 0.2 * Math.random() )
	} );

	scene.add( group );

	zoomObjectBoundingSphere( group )

}



function requestFile( url, callback ) {

	xhr = new XMLHttpRequest();
	xhr.open( 'GET', url, true );
	xhr.onerror = ( xhr ) => console.log( 'error:', xhr  );
	//xhr.onprogress = ( xhr ) => console.log( 'bytes loaded:', xhr.loaded );
	xhr.onload = ( xhr ) => callback( xhr.target.response );
	xhr.send( null );

}



function setStats() {

	const script=document.head.appendChild( document.createElement('script') );
	script.onload=() => {
		const stats=new Stats();document.body.appendChild(stats.dom);
		requestAnimationFrame( function loop() { stats.update(); requestAnimationFrame(loop) } );
	};
	script.src="https://raw.githack.com/mrdoob/stats.js/master/build/stats.min.js";


	const render = renderer.info.render;

	divInfo.classList.add("navText");
	divInfo.innerHTML = `
	Renderer<br>
	Calls: ${render.calls }<br>
	Triangles: ${render.triangles.toLocaleString() }<br>
	`;

}


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	controls.handleResize();

	//console.log( 'onWindowResize  window.innerWidth', window.innerWidth );

}



function animate() {

	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	controls.update();
	group.rotation.z += sceneRotation / 1000;

}
