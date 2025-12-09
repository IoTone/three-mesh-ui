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

	camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 100);

	renderer = new THREE.WebGLRenderer({
		antialias: true,
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(WIDTH, HEIGHT);
	renderer.xr.enabled = true;
	document.body.appendChild(ARButton.createButton(renderer));
	document.body.appendChild(renderer.domElement);

	controls = new OrbitControls(camera, renderer.domElement);
	camera.position.set(0, 1.6, 0);
	controls.target = new THREE.Vector3(0, 1, -1.8);
	controls.update();

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
		new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
		new THREE.LineBasicMaterial({
			color: 0x00ff00, // 0x808080,
			opacity: 0.65,
			transparent: true,
		}),
	);

	// threejs.org/docs/#TeapotGeometry
	// TODO: Improve this: https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_teapot.html
	const geometry = new TeapotGeometry(0.25, 18).translate(0, -1.5, -1);
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

	controls.update();
	renderer.render(scene, camera);
}
