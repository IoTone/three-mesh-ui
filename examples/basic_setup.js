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

window.addEventListener("load", init);
window.addEventListener("resize", onWindowResize);

//

function init() {
	scene = new THREE.Scene();
	// scene.background = new THREE.Color(0x505050);

	camera = new THREE.PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.1,
		10,
	);
	camera.position.set(0, 1.6, 3);
	// camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 100);

	// renderer = new THREE.WebGPURenderer( { antialias: true, forceWebGL: true, colorBufferType: THREE.UnsignedByteType, multiview: true } );

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	// renderer.setSize(WIDTH, HEIGHT);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;
	// Ensure XR reference space is 'local-floor' so the camera starts at standing height (~1.6m)
	// renderer.xr.setReferenceSpaceType("local-floor");
	// document.body.appendChild(ARButton.createButton(renderer));
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
	// document.body.appendChild(ARButton.createButton(renderer));
	document.body.appendChild(renderer.domElement);
	renderer.xr.setReferenceSpaceType("local-floor");

	controls = new OrbitControls(camera, renderer.domElement);
	camera.position.set(0, 2.6, 0);
	/*
	const cameraGroup = new THREE.Group();
	cameraGroup.position.set(0, -1, 1.5); // Set the initial VR Headset Position.
	*/
	controls.target = new THREE.Vector3(0, 1, -1.8);
	controls.update();

	const sun = new THREE.DirectionalLight(0xffffcc);
	sun.position.set(0, 1, 0);
	scene.add(sun);

	// roomGenerator()
	// TODO: make this into a utility function to use in all samples
	// When you need a virtual environment that shows you are in mixed reality
	// but relatively low polygon and simple
	//
	// It would be interesting to have some variety generated randomly in room architecture
	//
	// TODO:
	// Default: a wall in front of the user, and a floor, nothing to the left or right
	// and some decorations behind the user
	// https://threejs.org/docs/#BoxLineGeometry
	//
	// alt light gray: #c5c5c4
	// gray: 0x808080
	//
	/*
	const room = new THREE.LineSegments(
		new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
		new THREE.LineBasicMaterial({
			color: 0x00ff00, // 0x808080,
			opacity: 0.35,
			transparent: true,
		}),
	); */

	const room = new THREE.LineSegments(
		new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 0, 0),
		new THREE.LineBasicMaterial({ color: 0xbcbcbc }),
	);
	scene.add(room);

	// threejs.org/docs/#TeapotGeometry
	// TODO: Improve this: https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_teapot.html
	const geometry = new TeapotGeometry(0.15, 18).translate(0, -0.75, 0);
	const material = new THREE.MeshBasicMaterial({
		wireframe: true,
		color: 0x00ff00,
	}); // new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const teapot = new THREE.Mesh(geometry, material);

	// scene.add(room);
	scene.add(teapot);
	// TEXT PANEL

	makeTextPanel();
	makeGrass();
	makePictureFrame(0, 0.5, -3);

	renderer.setAnimationLoop(loop);
}

//
function makeGrass() {
	const tex = new THREE.TextureLoader().load(
		"https://upload.wikimedia.org/wikipedia/commons/4/4c/Grass_Texture.png",
	);
	tex.anisotropy = 32;
	tex.repeat.set(100, 100);
	tex.wrapT = THREE.RepeatWrapping;
	tex.wrapS = THREE.RepeatWrapping;
	const geo = new THREE.PlaneBufferGeometry(5, 5);
	const mat = new THREE.MeshLambertMaterial({
		map: tex,
	});
	const mesh = new THREE.Mesh(geo, mat);
	mesh.position.set(0, -1, 0);
	mesh.rotation.set(Math.PI / -2, 0, 0);
	scene.add(mesh);
}

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

	container.position.set(0, 0.25, -1.8);
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
			// TODO: Need a font that supports hirigana/katakana/kanji はじめまして
			// MSDF Glyph doesn't !?
			content:
				" As well as multi font size lines with consistent vertical spacing. :)",
			fontSize: 0.08,
		}),
	);

	return;
	// TODO: fix this as it causes a warning in the webpack stage, unreachable
	container.onAfterUpdate = function () {
		console.log(container.lines);

		if (!container.lines) return;

		console.log("lines", container.lines);

		var plane = new Mesh(
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
}

function makeAFloor() {
	const floorGometry = new THREE.PlaneGeometry(4, 4);
	const floorMaterial = new THREE.MeshStandardMaterial({
		color: 0x222222,
		roughness: 1.0,
		metalness: 0.0,
	});
	const floor = new THREE.Mesh(floorGometry, floorMaterial);
	floor.rotation.x = -Math.PI / 2;
	scene.add(floor);

	const grid = new THREE.GridHelper(10, 20, 0x111111, 0x111111);
	grid.material.depthTest = false; // avoid z-fighting
	scene.add(grid);

	scene.add(new THREE.HemisphereLight(0x888877, 0x777788));

	const light = new THREE.DirectionalLight(0xffffff, 0.5);
	light.position.set(0, 4, 0);
	scene.add(light);
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

	// controls.update();
	renderer.render(scene, camera);
}
