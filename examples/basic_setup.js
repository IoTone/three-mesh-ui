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
	scene.background = new THREE.Color(0x505050);
	// camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

	camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 100);

	renderer = new THREE.WebGLRenderer({
		antialias: true,
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(WIDTH, HEIGHT);
	renderer.xr.enabled = true;
	// Ensure XR reference space is 'local-floor' so the camera starts at standing height (~1.6m)
	renderer.xr.setReferenceSpaceType("local-floor");
	const arButton = ARButton.createButton(renderer, {
		requiredFeatures: ["hit-test"], // Optional: Add if you need hit-testing for AR placement
		optionalFeatures: ["dom-overlay"],
		sessionInit: {
			// Explicitly request local-floor here too
			requiredFeatures: ["local-floor"],
		},
	});
	document.body.appendChild(arButton);
	document.body.appendChild(renderer.domElement);

	controls = new OrbitControls(camera, renderer.domElement);
	camera.position.set(0, 1.6, 0);
	/*
	const cameraGroup = new THREE.Group();
	cameraGroup.position.set(0, -1, 1.5); // Set the initial VR Headset Position.
	*/
	controls.target = new THREE.Vector3(0, 1, -1.8);
	controls.update();

	renderer.xr.addEventListener("sessionstart", function (event) {
		/*
		const session = event.target;
		scene.add(cameraGroup);
		cameraGroup.add(camera);
		session.addEventListener("end", function () {
			console.log("XR session ended");
			scene.remove(cameraGroup);
			cameraGroup.remove(camera);
		});
		*/
		console.log("camera position ", camera.position);
		const referenceSpace = renderer.xr.getReferenceSpace();
		console.log(
			"XR Reference Space Type:",
			referenceSpace ? referenceSpace.spaceType : "Unknown",
		);
		if (referenceSpace && referenceSpace.spaceType !== "local-floor") {
			console.warn(
				"Expected local-floor but got:",
				referenceSpace.spaceType,
				"- Camera may be at floor level. Calibrate your device or check browser support.",
			);
		}
	});
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
	const room = new THREE.LineSegments(
		new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 0 /* 3 */, 0),
		new THREE.LineBasicMaterial({
			color: 0x00ff00, // 0x808080,
			opacity: 0.35,
			transparent: true,
		}),
	);

	// threejs.org/docs/#TeapotGeometry
	// TODO: Improve this: https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_teapot.html
	const geometry = new TeapotGeometry(0.25, 18).translate(0, 0, 0);
	const material = new THREE.MeshBasicMaterial({
		wireframe: true,
		color: 0x00ff00,
	}); // new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const teapot = new THREE.Mesh(geometry, material);

	scene.add(room);
	scene.add(teapot);
	// TEXT PANEL

	makeTextPanel();

	//

	renderer.setAnimationLoop(loop);
}

//

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

	container.position.set(0, 1, -1.8);
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
	// renderer.render(scene, camera);

	// CRITICAL: use the XR camera when in AR/VR
	if (renderer.xr.isPresenting) {
		// This automatically uses the correct stereo cameras with proper head pose
		renderer.render(scene, renderer.xr.getCamera());
	} else {
		// Normal desktop mode – use your original camera + orbit controls
		controls.update();
		renderer.render(scene, camera);
	}
}
