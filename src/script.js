import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import testVetexShader from "./shaders/test/vertex.glsl";
import testFragmentShader from "./shaders/test/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')
canvas.addEventListener("drop", handleFileDrop);
canvas.addEventListener("dragover", (e) => e.preventDefault())

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const flagTexture = textureLoader.load("textures/thepro.jpg")

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(1, 1, 31, 31)
const count = geometry.attributes.position.count;
// console.log(count)
const randoms = new Float32Array(count);
// for (let i = 0; i < count; i++)
// {
//     randoms[ i ] = Math.random();
// }

// geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

// Material
const material = new THREE.ShaderMaterial({
    vertexShader: testVetexShader,
    fragmentShader: testFragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
        uFrequency: {
            value: new THREE.Vector2(10, 5)
        },

        uTime: {
            value: 0
        },

        uTimeMul: {
            value: 1.0
        },

        uBaseColor: {
            value: new THREE.Color("white")
        },

        uPeakColor: {
            value: new THREE.Color("white")
        },

        uTexture: {
            value: flagTexture
        },

        uElevationMul: {
            value: .1
        },

        uColorIntensity: {
            value: 3.
        }
    }
})

gui.add(material.uniforms.uFrequency.value, "x", 0, 20, .01).name("freqX")
gui.add(material.uniforms.uFrequency.value, "y", 0, 20, .01).name("freqY")
gui.add(material.uniforms.uTimeMul, "value", 1., 30., .01).name("timeMul")
gui.add(material.uniforms.uElevationMul, "value", -1., 1., .001).name("elevationMul")
gui.add(material.uniforms.uColorIntensity, "value", 1., 30., .01).name("colorIntensity")
gui.addColor(material.uniforms.uBaseColor, "value").name("baseColor")
gui.addColor(material.uniforms.uPeakColor, "value").name("peakColor")

// Mesh
const mesh = new THREE.Mesh(geometry, material)
mesh.scale.y = 2 / 3;
scene.add(mesh)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0.25, - 0.25, 1)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Audio handling stuff.
const FFT_SIZE = 1024;
let _audioCtx = undefined;
let sourceNode = undefined;
let gainNode = undefined;
let analyserNode = undefined;
let _waveFormDataFloat = new Float32Array(FFT_SIZE);

function play (buffer)
{
    console.log('playing...');
    sourceNode.buffer = buffer;
    sourceNode.start(0);
    if (_audioCtx.state === 'suspended')
    {
        _audioCtx.resume();
    }
}

function stopPlayBack ()
{
    try
    {
        sourceNode.stop(0);
    } catch (e)
    {
        console.error("Caught an err while stopping playback:", e);
    }
}

function decodeAndPlay (arrayBuffer)
{
    _audioCtx.decodeAudioData(arrayBuffer, function (buffer)
    {
        play(buffer);
    });
}

function setupAudioCtx ()
{
    if (_audioCtx === undefined)
    {
        // Create from scratch.
        _audioCtx = new AudioContext();
        sourceNode = _audioCtx.createBufferSource();
        analyserNode = _audioCtx.createAnalyser();
        gainNode = _audioCtx.createGain();
        sourceNode.connect(gainNode);
        sourceNode.connect(analyserNode);
        gainNode.connect(_audioCtx.destination);
        analyserNode.fftSize = FFT_SIZE;
    }
    else
    {
        // Stop current playback and recreate the source node.
        stopPlayBack();
        sourceNode.disconnect();
        sourceNode = _audioCtx.createBufferSource();
        sourceNode.connect(gainNode);
        sourceNode.connect(analyserNode);
    }
    sourceNode.loop = true;
}

function handleFileDrop (e)
{
    e.preventDefault();
    const r = new FileReader();

    if (e.dataTransfer.files[ 0 ].type.indexOf("image") !== -1)
    {
        // Construct texture from image and pass it to material.
        r.onload = (readRes) =>
        {
            const i = new Image();
            i.onload = (e) =>
            {
                const t = new THREE.Texture(e.target);
                material.uniforms.uTexture.value = t;
                material.needsUpdate = true;
                t.needsUpdate = true;
            }
            i.src = readRes.target.result;
        }
        r.readAsDataURL(e.dataTransfer.files[0])
    }
    else
    {
        // Assume it's audio.
        setupAudioCtx();
        r.onload = (readRes) =>
        {
            decodeAndPlay(readRes.target.result);
        };
        r.readAsArrayBuffer(e.dataTransfer.files[0]);
    }
}

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    material.uniforms.uTime.value = elapsedTime;

    if (analyserNode)
    {
        analyserNode.getFloatTimeDomainData(_waveFormDataFloat);
        geometry.setAttribute("aRandom", new THREE.BufferAttribute(_waveFormDataFloat, 1));
    }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
