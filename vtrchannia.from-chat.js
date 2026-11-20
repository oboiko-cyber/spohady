// Транскрипція коду з повідомлення, 07.11.2026.
// У повідомленні фрагмент підписано «Втр_чання», але він завантажує
// «Глітч-портал у палаці Менін.png». Атрибуція потребує авторського підтвердження.
// Під час перенесення один заголовок користувача стояв усередині циклу;
// його вилучено й відновлено цілісний синтаксичний блок.
let img;
let memoryLayer;
let tempLayer;

const ZOOM = 1.35;
const LENS_SIZE = 190;
const DISTORTION_RADIUS = 90;
const DISTORTION_STRENGTH = 0.09;

let lastMouseX = -1000;
let lastMouseY = -1000;

async function setup() {
  img = await loadImage('Глітч-портал у палаці Менін.png');
  let scale = 1;
  if (img.width > 900) scale = 900 / img.width;
  let canvasWidth = img.width * scale;
  let canvasHeight = img.height * scale;
  createCanvas(canvasWidth, canvasHeight);
  memoryLayer = createGraphics(canvasWidth, canvasHeight);
  tempLayer = createGraphics(canvasWidth, canvasHeight);
  memoryLayer.image(img, 0, 0, canvasWidth, canvasHeight);
}

function draw() {
  if (!memoryLayer) return;
  image(memoryLayer, 0, 0);
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    distortMemory();
    image(memoryLayer, 0, 0);
    drawLens(mouseX, mouseY);
  }
}

function distortMemory() {
  let movement = dist(mouseX, mouseY, lastMouseX, lastMouseY);
  if (movement < 4) return;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  let r = DISTORTION_RADIUS;
  tempLayer.clear();
  tempLayer.image(memoryLayer, 0, 0);
  memoryLayer.drawingContext.save();
  memoryLayer.drawingContext.beginPath();
  memoryLayer.drawingContext.arc(mouseX, mouseY, r, 0, TWO_PI);
  memoryLayer.drawingContext.clip();
  for (let y = mouseY - r; y < mouseY + r; y += 8) {
    for (let x = mouseX - r; x < mouseX + r; x += 8) {
      let d = dist(x, y, mouseX, mouseY);
      if (d > r) continue;
      let normalized = d / r;
      let strength = pow(1 - normalized, 2);
      let waveX = sin(y * 0.035 + frameCount * 0.008) * 8 * strength;
      let waveY = cos(x * 0.032 + frameCount * 0.007) * 5 * strength;
      let jitter = random(-0.8, 0.8) * strength;
      let shiftX = waveX * DISTORTION_STRENGTH;
      let shiftY = waveY * DISTORTION_STRENGTH;
      memoryLayer.image(
        tempLayer,
        x + shiftX,
        y + shiftY,
        8,
        8,
        x + jitter,
        y + jitter,
        8,
        8
      );
    }
  }
  memoryLayer.drawingContext.restore();
}

function drawLens(x, y) {
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(x, y, LENS_SIZE / 2, 0, TWO_PI);
  drawingContext.clip();
  let sourceSize = LENS_SIZE / ZOOM;
  image(
    memoryLayer,
    x - LENS_SIZE / 2,
    y - LENS_SIZE / 2,
    LENS_SIZE,
    LENS_SIZE,
    x - sourceSize / 2,
    y - sourceSize / 2,
    sourceSize,
    sourceSize
  );
  drawingContext.restore();
  noFill();
  stroke(255, 220);
  strokeWeight(3);
  circle(x, y, LENS_SIZE);
  stroke(255, 85);
  strokeWeight(2);
  arc(x - 10, y - 10, LENS_SIZE - 22, LENS_SIZE - 22, radians(210), radians(315));
  pop();
}

function touchMoved() {
  if (
    touches.length > 0 &&
    touches[0].x >= 0 &&
    touches[0].x <= width &&
    touches[0].y >= 0 &&
    touches[0].y <= height
  ) {
    return false;
  }
}
