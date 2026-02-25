import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BoxLineGeometry } from "three/examples/jsm/geometries/BoxLineGeometry.js";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js";

import ThreeMeshUI from "../src/three-mesh-ui.js";

import FontJSON from "./assets/Roboto-msdf.json";
import FontImage from "./assets/Roboto-msdf.png";

import { Mesh, MeshBasicMaterial, PlaneGeometry } from "three";

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

let scene, camera, renderer, controls;
let campos = new THREE.Vector3();

window.addEventListener("load", init);
window.addEventListener("resize", onWindowResize);

//

function init() {
	scene = new THREE.Scene();

	// Uncommont to change all background to match this color
	// scene.background = new THREE.Color(0x505050);

	// camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 100);
	camera = new THREE.PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.1,
		10,
	);
	camera.position.set(0, 1.6, 3);
	campos.setFromMatrixPosition( camera.matrixWorld );
	
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(WIDTH, HEIGHT);
	renderer.xr.enabled = true;
	// document.body.appendChild(VRButton.createButton(renderer));
	const arButton = ARButton.createButton(renderer, {
			// requiredFeatures: ["hit-test"], // Optional: Add if you need hit-testing for AR placement
			optionalFeatures: ["dom-overlay"],
			sessionInit: {
				// Explicitly request local-floor here too
				requiredFeatures: [
					"local-floor",
					"bounded-floor",
					"hand-tracking",
					"layers",
				],
			},
	});
	document.body.appendChild(arButton);
	document.body.appendChild(renderer.domElement);
	renderer.xr.setReferenceSpaceType("local-floor");

	controls = new OrbitControls(camera, renderer.domElement);
	// camera.position.set(0, 3.0, 0);
	camera.position.set(0, 2.6, 0);
	// camera.position.set(0, 1.6, 0);

	/*
	const cameraGroup = new THREE.Group();
	cameraGroup.position.set(0, -1, 1.5); // Set the initial VR Headset Position.
	*/
	controls.target = new THREE.Vector3(0, 1, -1.8);
	controls.update();

	// ROOM

	const room = new THREE.LineSegments(
		new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 2, 0), // Floor height offset is the Y component in this scene
		new THREE.LineBasicMaterial({ color: 0x808080 }),
	);

	scene.add(room);

	// Sunshine
	const sun = new THREE.DirectionalLight(0xffffcc);
	sun.position.set(0, 1, 0);
	scene.add(sun);

	// Teapot
	// TODO: Improve this: https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_teapot.html
	const geometry = new TeapotGeometry(0.15, 18).translate(0, 1, 0);
	const material = new THREE.MeshBasicMaterial({
		wireframe: true,
		color: 0x00ff00,
	}); // new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const teapot = new THREE.Mesh(geometry, material);
	scene.add(teapot);
	// TEXT PANEL

	makeTextPanel();
	makePictureFrame(0, 0.5, -3);
	//

	renderer.setAnimationLoop(loop);
}

//
// Scene Utilities
//

function makePictureFrame(xoffset, yoffset, zoffset) {
	const points = [];
	points.push(new THREE.Vector3(-1 + xoffset, 1 + yoffset, 0 + zoffset));
	points.push(new THREE.Vector3(1 + xoffset, 1 + yoffset, 0 + zoffset));
	points.push(new THREE.Vector3(1 + xoffset, -1 + yoffset, 0 + zoffset));
	points.push(new THREE.Vector3(-1 + xoffset, -1 + yoffset, 0 + zoffset));
	points.push(new THREE.Vector3(-1 + xoffset, 1 + yoffset, 0 + zoffset)); // Close the loop

	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const line = new THREE.LineLoop(geometry, material); // Or THREE.LineSegments
	scene.add(line);
}

function makeTextPanel() {
	const container = new ThreeMeshUI.Block({
		width: 1.3,
		height: 0.5,
		padding: 0.05,
		justifyContent: "center",
		textAlign: "left",
		fontFamily: FontJSON,
		fontTexture: FontImage,
		// interLine: 0,
	});

	
	// container.position.set(0, 1, -1.8);
	container.position.set(0, 0, -1.8);
	container.rotation.x = -0.55;
	scene.add(container);

	//

	container.add(
		new ThreeMeshUI.Text({
			// content: 'This library supports line-break-friendly-characters,',
			content: "This library supports line break friendly characters",
			fontSize: 0.055,
		}),

		new ThreeMeshUI.Text({
			content:
				" As well as multi font size lines with consistent vertical spacing : ",
			fontSize: 0.08,
		}),
		new ThreeMeshUI.Text({
			content: "x " + campos.x + " y " + campos.y + " z " + campos.z,
			fontSize: 0.03,
		}),

	);


	return;
	// Uncomment to apply this effect
	/*
	container.onAfterUpdate = function () {
		console.log(container.lines);

		if (!container.lines) return;

		console.log("lines", container.lines);

		const plane = new Mesh(
			new PlaneGeometry(container.lines.width, container.lines.height),
			new MeshBasicMaterial({ color: 0xff9900 }),
		);

		// plane.position.x = container.lines.x;
		// plane.position.y = container.lines.height/2 - container.getInterLine()/2;

		const INNER_HEIGHT = container.getHeight() - (container.padding * 2 || 0);

		if (container.getJustifyContent() === "start") {
			plane.position.y = INNER_HEIGHT / 2 - container.lines.height / 2;
		} else if (container.getJustifyContent() === "center") {
			plane.position.y = 0;
		} else {
			plane.position.y = -(INNER_HEIGHT / 2) + container.lines.height / 2;
		}

		container.add(plane);
	};
	*/
}

// handles resizing the renderer when the viewport is resized

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function loop() {
	// Don't forget, ThreeMeshUI must be updated manually.
	// This has been introduced in version 3.0.0 in order
	// to improve performance
	ThreeMeshUI.update();

	controls.update();
	// console.log(campos);
	
	renderer.render(scene, camera);
}
