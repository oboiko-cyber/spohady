let sound;
let skinImage;
let analyzer;

let started = false;
let loading = true;

let skinShader;

let smoothLevel = 0;


// --------------------------------
// SETUP
// --------------------------------

async function setup() {

  skinImage = await loadImage(
    "scene.jpg"
  );

  sound = await loadSound(
    "sound.mp3"
  );

  analyzer = new p5.Amplitude();

  sound.connect(analyzer);


  // WEBGL
  createCanvas(
    windowWidth,
    windowHeight,
    WEBGL
  );

  pixelDensity(1);


  // Створюємо shader
  skinShader = createShader(
    vertexShaderSource,
    fragmentShaderSource
  );

  shader(skinShader);

  loading = false;

  console.log("Усе завантажено");
}


// --------------------------------
// DRAW
// --------------------------------

function draw() {

  background(0);


  // --------------------------------
  // ЗАВАНТАЖЕННЯ
  // --------------------------------

  if (loading) {

    resetShader();

    fill(255);
    noStroke();

    textAlign(
      CENTER,
      CENTER
    );

    textSize(20);

    text(
      "Завантаження...",
      0,
      0
    );

    return;
  }


  // --------------------------------
  // ДО ЗАПУСКУ
  // --------------------------------

  if (!started) {

    shader(skinShader);

    skinShader.setUniform(
      "uTexture",
      skinImage
    );

    skinShader.setUniform(
      "uWave",
      0.0
    );

    skinShader.setUniform(
      "uTime",
      0.0
    );

    drawFullscreen();

    resetShader();

    fill(255);
    noStroke();

    textAlign(
      CENTER,
      CENTER
    );

    textSize(20);

    text(
      "Натисніть, щоб почати",
      0,
      0
    );

    return;
  }


  // --------------------------------
  // ГУЧНІСТЬ
  // --------------------------------

  let level =
    analyzer.getLevel();


  // Дуже сильне згладжування
  smoothLevel = lerp(
    smoothLevel,
    level,
    0.025
  );


  // --------------------------------
  // СИЛА ХВИЛІ
  // --------------------------------

  let wave =
    map(
      smoothLevel,
      0,
      0.3,
      0,
      1
    );

  wave = constrain(
    wave,
    0,
    1
  );


  // --------------------------------
  // SHADER
  // --------------------------------

  shader(skinShader);

  skinShader.setUniform(
    "uTexture",
    skinImage
  );

  skinShader.setUniform(
    "uWave",
    wave
  );

  skinShader.setUniform(
    "uTime",
    frameCount * 0.008
  );


  drawFullscreen();
}


// --------------------------------
// ПОВНИЙ ЕКРАН
// --------------------------------

function drawFullscreen() {

  noStroke();

  beginShape();

  vertex(
    -width / 2,
    -height / 2,
    0,
    0,
    0
  );

  vertex(
    width / 2,
    -height / 2,
    0,
    1,
    0
  );

  vertex(
    width / 2,
    height / 2,
    0,
    1,
    1
  );

  vertex(
    -width / 2,
    height / 2,
    0,
    0,
    1
  );

  endShape(CLOSE);
}


// --------------------------------
// КЛІК
// --------------------------------

function mousePressed() {

  if (!sound) {
    return;
  }


  if (!started) {

    started = true;

    sound.loop();

    return;
  }


  if (sound.isPlaying()) {

    sound.pause();

  } else {

    sound.play();

  }
}


// --------------------------------
// RESIZE
// --------------------------------

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );
}


// ================================================
// VERTEX SHADER
// ================================================

const vertexShaderSource = `

precision highp float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;

void main() {

  vTexCoord = aTexCoord;

  vec4 positionVec4 =
    vec4(
      aPosition,
      1.0
    );

  gl_Position =
    uProjectionMatrix *
    uModelViewMatrix *
    positionVec4;
}
`;


// ================================================
// FRAGMENT SHADER
// ================================================

const fragmentShaderSource = `

precision highp float;

uniform sampler2D uTexture;

uniform float uWave;
uniform float uTime;

varying vec2 vTexCoord;

void main() {

  vec2 uv = vTexCoord;


  // --------------------------------
  // ХВИЛЯ ПО ВСІЙ ПОВЕРХНІ
  // --------------------------------

  float wave1 =
    sin(
      uv.y * 8.0
      - uTime
    );


  // Друга, повільніша хвиля
  float wave2 =
    sin(
      uv.y * 3.5
      - uTime * 0.55
    );


  // Дуже слабка горизонтальна хвиля
  float horizontalWave =
    sin(
      uv.x * 5.0
      + uTime * 0.35
    );


  // --------------------------------
  // ЗМІЩЕННЯ
  // --------------------------------

  float strength =
    uWave * 0.025;


  uv.x +=
    wave1 *
    strength;


  uv.x +=
    wave2 *
    strength *
    0.45;


  uv.y +=
    horizontalWave *
    strength *
    0.18;


  // --------------------------------
  // ТЕКСТУРА
  // --------------------------------

  uv = clamp(
    uv,
    0.001,
    0.999
  );


  vec4 color =
    texture2D(
      uTexture,
      uv
    );


  gl_FragColor =
    color;
}
`;
