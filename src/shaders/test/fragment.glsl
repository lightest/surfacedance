precision mediump float;
uniform vec3 uBaseColor;
uniform vec3 uPeakColor;
uniform float uElevationMul;
uniform float uColorIntensity;
uniform sampler2D uTexture;

// varying float vRandom;
varying vec2 vUv;
varying float vElevation;

void main () {
    vec4 c = texture2D(uTexture, vUv);
    c.xyz *= vElevation * uColorIntensity + .5;
    c.xyz *= mix(uBaseColor, uPeakColor, vElevation / uElevationMul);
    gl_FragColor = vec4(c.xyz, 1.);
}
