import { ShaderMaterial, TextureLoader, Vector2 } from "three";

/**
 * Blends a day and a night Earth texture based on where the sun actually is
 * right now, so the globe shows a real day/night terminator — adapted from
 * globe.gl's own official day-night-cycle example (same technique, ported
 * to a plain requestless sun-position formula instead of the `solar-calculator`
 * package, to avoid adding a dependency for a decorative effect).
 */
const dayNightShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #define PI 3.141592653589793
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform vec2 sunPosition;
    uniform vec2 globeRotation;
    varying vec3 vNormal;
    varying vec2 vUv;

    float toRad(in float a) {
      return a * PI / 180.0;
    }

    vec3 Polar2Cartesian(in vec2 c) { // [lng, lat]
      float theta = toRad(90.0 - c.x);
      float phi = toRad(90.0 - c.y);
      return vec3(
        sin(phi) * cos(theta),
        cos(phi),
        sin(phi) * sin(theta)
      );
    }

    void main() {
      float invLon = toRad(globeRotation.x);
      float invLat = -toRad(globeRotation.y);
      mat3 rotX = mat3(
        1, 0, 0,
        0, cos(invLat), -sin(invLat),
        0, sin(invLat), cos(invLat)
      );
      mat3 rotY = mat3(
        cos(invLon), 0, sin(invLon),
        0, 1, 0,
        -sin(invLon), 0, cos(invLon)
      );
      vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
      float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      float blendFactor = smoothstep(-0.1, 0.1, intensity);
      gl_FragColor = mix(nightColor, dayColor, blendFactor);
    }
  `,
};

/**
 * Sub-solar point [longitude, latitude] at a given time — the point on
 * Earth where the sun is directly overhead. Longitude comes from how far
 * through the UTC day it is; latitude (declination) from a standard
 * approximation of Earth's axial tilt through the year. Accurate to
 * roughly a degree, which is invisible at globe scale — this drives a
 * decorative terminator, not navigation.
 */
export function sunPositionAt(date: Date): [lng: number, lat: number] {
  const ms = date.getTime();
  const dayStartMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const fractionOfDay = (ms - dayStartMs) / 86_400_000;
  const longitude = 180 - fractionOfDay * 360;

  const startOfYearMs = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((ms - startOfYearMs) / 86_400_000);
  const declination = 23.44 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));

  return [longitude, declination];
}

export async function loadDayNightMaterial(assetUrl: (path: string) => string): Promise<ShaderMaterial> {
  const loader = new TextureLoader();
  const [dayTexture, nightTexture] = await Promise.all([
    loader.loadAsync(assetUrl("/textures/earth-day.jpg")),
    loader.loadAsync(assetUrl("/textures/earth-night.jpg")),
  ]);

  return new ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTexture },
      nightTexture: { value: nightTexture },
      sunPosition: { value: new Vector2(...sunPositionAt(new Date())) },
      globeRotation: { value: new Vector2(0, 0) },
    },
    vertexShader: dayNightShader.vertexShader,
    fragmentShader: dayNightShader.fragmentShader,
  });
}
