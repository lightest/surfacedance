precision mediump float;
uniform vec2 uFrequency;
uniform float uTime;
uniform float uTimeMul;
uniform float uElevationMul;

attribute float aRandom;

// varying float vRandom;
varying vec2 vUv;
varying float vElevation;

void main () {
    float t = uTime * uTimeMul;
    vec4 modelPosition = modelMatrix * vec4(position, 1.);
    float elevation = sin(modelPosition.x * uFrequency.x - t) * uElevationMul;
    elevation += sin(modelPosition.y * uFrequency.y - t) * uElevationMul;
    elevation += aRandom * uElevationMul;
    modelPosition.z += elevation;
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    // vRandom = aRandom;
    vUv = uv;
    vElevation = elevation;
    gl_Position = projectedPosition;
}
