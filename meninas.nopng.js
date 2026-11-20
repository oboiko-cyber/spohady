// Робоча копія sources/meninas.from-chat.js БЕЗ картини-порталу (оригінал не змінено).
// Транскрипція коду з повідомлення, 07.11.2026.
// Атрибуція за вмістом (картина Менін, камера в дзеркалі); оригінальні файли потрібні для звірки.
let video;
let painting;

let canvasW = 640;
let canvasH = 720;

let mirrorX = 170;
let mirrorY = 160;
let mirrorW = 300;
let mirrorH = 400;

let currentAlpha = 150;
let targetAlpha = 150;

let visibilityTimer = 0;
let nextVisibilityChange = 220;
let isFading = false;

let glitchTimer = 0;
let glitchDuration = 0;
let glitchOffset = 0;
let glitchActive = false;

async function setup() {
  createCanvas(canvasW, canvasH);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
}

function draw() {
  background(7, 9, 14); // без картини-порталу: лише темне тло й дзеркало з камерою
  noFill(); stroke(255, 60); rect(mirrorX - 1, mirrorY - 1, mirrorW + 2, mirrorH + 2); noStroke();
  currentAlpha = lerp(currentAlpha, targetAlpha, 0.035);

  visibilityTimer++;
  if (visibilityTimer > nextVisibilityChange) {
    visibilityTimer = 0;
    isFading = !isFading;
    if (isFading) {
      targetAlpha = 8;
      nextVisibilityChange = random(70, 130);
    } else {
      targetAlpha = 150;
      nextVisibilityChange = random(220, 400);
    }
  }

  glitchTimer++;
  if (!glitchActive && glitchTimer > random(80, 180)) {
    glitchTimer = 0;
    glitchActive = true;
    glitchDuration = random(4, 10);
    glitchOffset = random(-45, 45);
  }

  if (glitchActive) {
    glitchDuration--;
    if (glitchDuration <= 0) {
      glitchActive = false;
      glitchOffset = 0;
    }
  }

  if (video && video.elt.readyState >= 2) {
    drawCamera();
  }
}

function drawCamera() {
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(mirrorX, mirrorY, mirrorW, mirrorH);
  drawingContext.clip();

  let videoScaleX = mirrorW / video.width;
  let videoScaleY = mirrorH / video.height;
  let videoScale = max(videoScaleX, videoScaleY);
  let drawW = video.width * videoScale;
  let drawH = video.height * videoScale;
  let offsetX = (mirrorW - drawW) / 2;
  let offsetY = (mirrorH - drawH) / 2;

  translate(mirrorX + mirrorW, mirrorY);
  scale(-1, 1);

  tint(255, currentAlpha);
  image(video, offsetX, offsetY, drawW, drawH);

  if (glitchActive) {
    for (let i = 0; i < 4; i++) {
      let stripY = random(0, mirrorH);
      let stripH = random(8, 25);
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(0, stripY, mirrorW, stripH);
      drawingContext.clip();
      let stripOffset = glitchOffset * random(0.5, 1.3);
      image(video, offsetX + stripOffset, offsetY, drawW, drawH);
      drawingContext.restore();
    }
  }

  drawingContext.restore();
  pop();
}
