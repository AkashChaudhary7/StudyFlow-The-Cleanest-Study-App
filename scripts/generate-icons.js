import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure Node PNG generator without heavy binary dependencies
function createPNG(width, height, drawPixel) {
  // RGBA buffer: 4 bytes per pixel + 1 filter byte per scanline
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type 6: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);
  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc >>> 0, 8 + length);
  return buffer;
}

// Simple CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Icon rendering logic for StudyFlow
function drawStudyFlowIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w; // 0 to 1
  const ny = y / h; // 0 to 1

  // Gradient background: from Electric Blue (#007AFF) to Indigo (#5856D6) to Purple (#AF52DE)
  const gradT = (nx + ny) / 2;
  let bgR = Math.round(0 * (1 - gradT) + 175 * gradT);
  let bgG = Math.round(122 * (1 - gradT) + 82 * gradT);
  let bgB = Math.round(255 * (1 - gradT) + 222 * gradT);

  // Rounded squircle check if not maskable
  if (!isMaskable) {
    const radius = 0.22;
    const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - radius));
    const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - radius));
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) {
      return [0, 0, 0, 0]; // Transparent outside corner
    }
  }

  const cx = 0.5;
  const cy = 0.5;
  const distFromCenter = Math.sqrt((nx - cx) * (nx - cx) + (ny - cy) * (ny - cy));

  // Circular ring 1 (outer dashed ring)
  const ring1Radius = isMaskable ? 0.28 : 0.32;
  const ring1Width = 0.012;
  if (Math.abs(distFromCenter - ring1Radius) < ring1Width) {
    const angle = Math.atan2(ny - cy, nx - cx);
    if (Math.sin(angle * 8) > -0.2) {
      return [255, 255, 255, 120];
    }
  }

  // Circular ring 2 (inner ring)
  const ring2Radius = isMaskable ? 0.21 : 0.24;
  const ring2Width = 0.008;
  if (Math.abs(distFromCenter - ring2Radius) < ring2Width) {
    return [255, 255, 255, 160];
  }

  // Draw Checkmark / Flow Glyph in center
  // Line 1: (0.35, 0.50) to (0.46, 0.61)
  // Line 2: (0.46, 0.61) to (0.67, 0.38)
  const scale = isMaskable ? 0.85 : 1.0;
  const px = (nx - 0.5) / scale + 0.5;
  const py = (ny - 0.5) / scale + 0.5;

  const d1 = distToSegment(px, py, 0.36, 0.51, 0.46, 0.61);
  const d2 = distToSegment(px, py, 0.46, 0.61, 0.67, 0.38);
  const checkWidth = 0.045;

  if (d1 < checkWidth || d2 < checkWidth) {
    return [255, 255, 255, 255];
  }

  // Star / Spark at top right (0.69, 0.30)
  const sparkDist = Math.sqrt((px - 0.70) * (px - 0.70) + (py - 0.30) * (py - 0.30));
  if (sparkDist < 0.04) {
    return [255, 214, 10, 255]; // Gold Spark
  }

  return [bgR, bgG, bgB, 255];
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

// Generate PNGs
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA Icons in /public...');

// 192x192
const png192 = createPNG(192, 192, (x, y, w, h) => drawStudyFlowIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 512x512
const png512 = createPNG(512, 512, (x, y, w, h) => drawStudyFlowIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Maskable 512x512 (Safe padding)
const pngMaskable = createPNG(512, 512, (x, y, w, h) => drawStudyFlowIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// Apple Touch Icon (180x180)
const pngApple = createPNG(180, 180, (x, y, w, h) => drawStudyFlowIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// Favicon (64x64)
const pngFavicon = createPNG(64, 64, (x, y, w, h) => drawStudyFlowIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pngFavicon);

console.log('Successfully generated all PWA icons!');
