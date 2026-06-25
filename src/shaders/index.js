// ──────────────────────────────────────────────
// SUN SHADER — Corona, flares, animated surface
// ──────────────────────────────────────────────
export const SunVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    
    // Subtle surface perturbation
    float disp = sin(position.x * 4.0 + uTime * 0.5) * 0.005
               + sin(position.y * 3.0 + uTime * 0.3) * 0.005;
    vec3 newPos = position + normal * disp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`

export const SunFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // Value noise
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i=0; i<6; i++) { v += a * noise(p); p *= 2.1; a *= 0.48; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.06;
    
    // Multi-octave animated solar surface
    float n1 = fbm(uv * 5.0 + vec2(t, t * 0.7));
    float n2 = fbm(uv * 10.0 - vec2(t * 0.5, t * 1.2));
    float n3 = fbm(uv * 20.0 + vec2(t * 1.3, -t * 0.4));
    float surface = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;
    
    // Solar granulation
    float granules = fbm(uv * 30.0 + vec2(t * 2.0, -t));
    surface = surface * 0.85 + granules * 0.15;
    
    // Color mapping: core white-yellow → mid orange → limb dark red
    vec3 col = mix(uColorA, uColorB, surface);
    col = mix(col, uColorC, pow(surface, 3.0));
    
    // Limb darkening
    vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(vPosition, 1.0)).xyz);
    float limb = dot(normalize(vNormal), viewDir);
    limb = clamp(limb, 0.0, 1.0);
    float darkening = 0.4 + 0.6 * pow(limb, 0.4);
    col *= darkening;
    
    // Solar flare hotspots
    float flare1 = smoothstep(0.85, 1.0, n1) * 0.8;
    float flare2 = smoothstep(0.80, 1.0, n2) * 0.5;
    col += vec3(1.0, 0.9, 0.6) * (flare1 + flare2);
    
    gl_FragColor = vec4(col, 1.0);
  }
`

// ──────────────────────────────────────────────
// CORONA / GLOW SHADER
// ──────────────────────────────────────────────
export const CoronaVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const CoronaFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 2.5);
    
    // Animated corona filaments
    float theta = atan(vNormal.y, vNormal.x);
    float phi = acos(vNormal.z);
    float coronaNoise = noise(vec2(theta * 3.0 + uTime * 0.05, phi * 4.0));
    float streamers = noise(vec2(theta * 8.0 + uTime * 0.03, phi * 6.0 - uTime * 0.02));
    
    float intensity = rim * (0.5 + coronaNoise * 0.3 + streamers * 0.2) * uIntensity;
    
    // Solar flare ejection simulation
    float flareAngle = mod(uTime * 0.15, 6.28318);
    float flareDist = abs(theta - flareAngle);
    float flareStreak = exp(-flareDist * flareDist * 20.0) * rim * 1.5;
    intensity += flareStreak;
    
    gl_FragColor = vec4(uColor * intensity, intensity * 0.85);
  }
`

// ──────────────────────────────────────────────
// PLANET PBR SHADER — roughness, metallic, atmosphere
// ──────────────────────────────────────────────
export const PlanetVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vSunDot;
  uniform vec3 uSunPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec3 toSun = normalize(uSunPosition - vPosition);
    vSunDot = dot(worldNormal, toSun);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const PlanetFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uEmissive;
  uniform vec3 uSunPosition;
  uniform float uRoughness;
  uniform float uMetalness;
  uniform float uPlanetType;  // 0=rocky 1=gas 2=ice 3=earth 4=mars
  uniform float uSelected;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vSunDot;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i=0; i<5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  // GGX/Schlick approximation for specular
  float ggx(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
    return a2 / (3.14159 * d * d + 0.0001);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 toSun = normalize(uSunPosition - vPosition);
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 H = normalize(toSun + viewDir);
    
    float NdotL = max(dot(N, toSun), 0.0);
    float NdotV = max(dot(N, viewDir), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    
    vec2 uv = vUv;
    vec3 baseColor;
    float roughnessFinal = uRoughness;
    
    if (uPlanetType < 0.5) {
      // Rocky planet — crater and rock texture
      float terrain = fbm(uv * 6.0 + uTime * 0.0001);
      float craters = smoothstep(0.6, 0.7, noise(uv * 15.0));
      float micro = noise(uv * 40.0) * 0.15;
      baseColor = mix(uColor1, uColor2, terrain);
      baseColor = mix(baseColor, uColor3, craters * 0.4);
      baseColor -= micro;
      roughnessFinal = 0.92 + terrain * 0.05;
    } else if (uPlanetType < 1.5) {
      // Gas giant — banded structure
      float band = uv.y * 8.0;
      float waviness = fbm(vec2(uv.x * 3.0, uv.y * 8.0) + uTime * 0.001) * 0.4;
      float bandMix = fract(band + waviness);
      float stormNoise = noise(uv * 20.0 + uTime * 0.002) * 0.3;
      baseColor = mix(uColor1, uColor2, sin(band + waviness) * 0.5 + 0.5);
      baseColor = mix(baseColor, uColor3, stormNoise);
      roughnessFinal = 0.15;
    } else if (uPlanetType < 2.5) {
      // Ice giant — smooth with methane haze
      float haze = fbm(uv * 4.0 + uTime * 0.0005);
      float streaks = noise(uv * 12.0 + vec2(uTime * 0.003, 0.0));
      baseColor = mix(uColor1, uColor2, haze * 0.5);
      baseColor += uColor3 * streaks * 0.15;
      roughnessFinal = 0.08;
    } else if (uPlanetType < 3.5) {
      // Earth-like: oceans + land
      float land = fbm(uv * 4.0);
      float isLand = step(0.42, land);
      float oceanDepth = noise(uv * 20.0) * 0.1;
      float landDetail = noise(uv * 30.0 + uTime * 0.00001) * 0.15;
      vec3 ocean = uColor1 * (0.7 + oceanDepth);
      vec3 landCol = mix(uColor2, uColor3, fbm(uv * 8.0));
      baseColor = mix(ocean, landCol, isLand);
      roughnessFinal = mix(0.05, 0.85, isLand);
    } else {
      // Mars-like: iron oxide regolith
      float terrain = fbm(uv * 5.0 + uTime * 0.00005);
      float dust = noise(uv * 25.0) * 0.2;
      float polar = smoothstep(0.7, 0.8, abs(uv.y - 0.5) * 2.0);
      baseColor = mix(uColor1, uColor2, terrain);
      baseColor += uColor3 * dust;
      baseColor = mix(baseColor, vec3(0.95, 0.97, 0.99), polar * 0.8);
      roughnessFinal = 0.98 - terrain * 0.05;
    }
    
    // PBR Lighting
    vec3 F0 = mix(vec3(0.04), baseColor, uMetalness);
    float specD = ggx(NdotH, roughnessFinal);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, viewDir), 0.0), 5.0);
    vec3 specular = specD * F;
    
    vec3 ambient = baseColor * 0.04;
    vec3 diffuse = baseColor * NdotL * (1.0 - uMetalness) * 0.95;
    vec3 spec = specular * NdotL * 0.6;
    
    // Night side emissive (city lights hint for Earth)
    float nightFactor = 1.0 - smoothstep(-0.2, 0.2, vSunDot);
    vec3 nightEmissive = uEmissive * nightFactor;
    
    // Rim / terminator glow
    float rim = 1.0 - NdotV;
    rim = pow(rim, 4.0);
    vec3 rimColor = uColor1 * 0.15 * rim;
    
    // Selection highlight
    float selRim = pow(1.0 - NdotV, 2.5) * uSelected;
    vec3 selColor = vec3(0.0, 0.85, 1.0) * selRim * 0.5;
    
    vec3 finalColor = ambient + diffuse + spec + nightEmissive + rimColor + selColor;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// ──────────────────────────────────────────────
// ATMOSPHERE SHADER — Rayleigh scattering
// ──────────────────────────────────────────────
export const AtmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const AtmosphereFragmentShader = `
  uniform vec3 uAtmosphereColor;
  uniform float uOpacity;
  uniform vec3 uSunPosition;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 toSun = normalize(uSunPosition - vPosition);
    
    // Rayleigh-like scattering: glow on sun-facing limb
    float sunDot = dot(vNormal, toSun);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 4.0);
    
    // Enhanced glow towards sun
    float sunRim = rim * smoothstep(-0.2, 0.8, sunDot);
    float backRim = rim * (1.0 - max(sunDot, 0.0)) * 0.15;
    
    // Mie scattering (the bright white spot around the sun)
    float mie = pow(max(dot(viewDir, -toSun), 0.0), 30.0) * rim * 2.0;
    
    float alpha = (sunRim + backRim + mie) * uOpacity;
    vec3 col = uAtmosphereColor * (0.8 + max(sunDot, 0.0) * 0.4);
    col += vec3(1.0, 0.9, 0.7) * mie; // Warm sun glow
    
    gl_FragColor = vec4(col, alpha);
  }
`

// ──────────────────────────────────────────────
// CLOUD SHADER — Dynamic volumetric-style
// ──────────────────────────────────────────────
export const CloudVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const CloudFragmentShader = `
  uniform float uTime;
  uniform vec3 uCloudColor;
  uniform float uCloudSpeed;
  uniform vec3 uSunPosition;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i=0; i<6; i++) { v += a * noise(p); p *= 2.2; a *= 0.45; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    uv.x += uTime * uCloudSpeed;
    
    // Multi-scale cloud formations
    float clouds = fbm(uv * 3.0);
    float wisps = fbm(uv * 8.0 + vec2(uTime * uCloudSpeed * 0.5, 0.0));
    float detail = noise(uv * 20.0 + uTime * uCloudSpeed * 0.3);
    
    float cloudMask = smoothstep(0.42, 0.7, clouds + wisps * 0.3);
    cloudMask += smoothstep(0.55, 0.75, wisps) * 0.4;
    cloudMask = clamp(cloudMask, 0.0, 1.0);
    
    // Sun shading on clouds
    vec3 N = normalize(vNormal);
    vec3 toSun = normalize(uSunPosition - vPosition);
    float sunDot = max(dot(N, toSun), 0.0) * 0.7 + 0.3;
    
    vec3 col = uCloudColor * sunDot;
    // Cloud shadow on dark side
    col *= mix(0.15, 1.0, sunDot);
    
    gl_FragColor = vec4(col, cloudMask * 0.85);
  }
`

// ──────────────────────────────────────────────
// SATURN RING SHADER — Ice & rock particles
// ──────────────────────────────────────────────
export const RingVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const RingFragmentShader = `
  uniform vec3 uRingColor;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform vec3 uSunPosition;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPosition;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float r = length(centered) * 2.0;
    
    float inner = uInnerRadius, outer = uOuterRadius;
    
    // Ring band density (Cassini Division, etc.)
    float normalizedR = (r - inner) / (outer - inner);
    
    // Smooth bounds check instead of discard for anti-aliasing
    float ringMask = smoothstep(0.0, 0.02, normalizedR) * (1.0 - smoothstep(0.98, 1.0, normalizedR));
    if (r < inner * 0.95 || r > outer * 1.05) discard;
    
    // Major divisions (B ring, A ring, Cassini Division)
    float cassini = smoothstep(0.38, 0.42, normalizedR) * (1.0 - smoothstep(0.42, 0.46, normalizedR));
    float enke = smoothstep(0.78, 0.80, normalizedR) * (1.0 - smoothstep(0.80, 0.82, normalizedR));
    
    // Fine structure noise
    float ringNoise = noise(vec2(normalizedR * 80.0, 0.5));
    float density = (0.6 + ringNoise * 0.4) * (1.0 - cassini * 0.85) * (1.0 - enke * 0.5);
    
    // Radial falloff
    density *= ringMask;
    
    // Sun shading
    vec3 toSun = normalize(uSunPosition - vPosition);
    float sunAngle = max(dot(vec3(0,1,0), toSun), 0.1);
    
    // Ice sparkle
    float sparkle = noise(vec2(normalizedR * 200.0 + uTime * 0.01, vUv.x * 50.0));
    vec3 col = uRingColor * density;
    col += vec3(1.0, 0.98, 0.95) * sparkle * density * 0.3; // ice glint
    col *= (0.5 + sunAngle * 0.7);
    
    gl_FragColor = vec4(col, density * 0.88 * ringMask);
  }
`

// ──────────────────────────────────────────────
// STARFIELD SHADER — HDR Milky Way
// ──────────────────────────────────────────────
export const StarfieldVertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const StarfieldFragmentShader = `
  uniform float uTime;
  varying vec3 vPosition;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i=0; i<4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 dir = normalize(vPosition);
    float theta = atan(dir.y, dir.x);
    float phi = acos(dir.z);
    vec2 uv = vec2(theta / 6.28318, phi / 3.14159);
    
    vec3 color = vec3(0.0);
    
    // ── Deep Space Nebula (Multi-layered FBM) ──
    float n1 = fbm(uv * 2.5 + vec2(uTime * 0.001));
    float n2 = fbm(uv * 5.0 - vec2(uTime * 0.0005));
    float n3 = fbm(uv * 10.0 + vec2(0.5, 0.2));
    
    // Galactic plane
    float galPlane = exp(-pow((uv.y - 0.5) * 6.0, 2.0));
    
    // Dust lanes and gas
    vec3 deepPurple = vec3(0.05, 0.02, 0.1);
    vec3 cosmicBlue = vec3(0.02, 0.04, 0.12);
    vec3 starDust   = vec3(0.12, 0.08, 0.05);
    
    color += deepPurple * n1;
    color += cosmicBlue * n2 * galPlane;
    color += starDust * n3 * galPlane * 0.5;
    
    // ── Procedural Stars (Multiple Scales) ──
    
    // Layer 1: Tiny distant background stars
    float s1 = hash(floor(uv * 800.0));
    if (s1 > 0.998) {
      color += vec3(0.8, 0.9, 1.0) * pow(hash(floor(uv * 800.0) + 1.5), 10.0) * 1.5;
    }
    
    // Layer 2: Medium bright stars with twinkling
    float s2 = hash(floor(uv * 300.0));
    if (s2 > 0.994) {
      float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + s2 * 100.0);
      vec3 starCol = mix(vec3(1.0, 0.95, 0.8), vec3(0.8, 0.9, 1.0), hash(floor(uv * 300.0) + 0.5));
      color += starCol * twinkle * 1.2;
    }
    
    // Layer 3: Large bright stars (fewer)
    float s3 = hash(floor(uv * 100.0));
    if (s3 > 0.99) {
      float glow = exp(-length(fract(uv * 100.0) - 0.5) * 8.0);
      color += vec3(1.0, 0.98, 0.9) * glow * 1.8;
    }
    
    // Global brightness curve
    color = pow(color, vec3(0.95)); // Slight gamma adjustment
    
    gl_FragColor = vec4(color, 1.0);
  }
`
