import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";
import type { AppCandidate } from "../schemas/candidates";
import { storagePaths } from "../storage/paths";

export type IconTheme = {
  id: string;
  name: string;
  description: string;
  palette: string[];
};

export type GeneratedIcon = {
  id: string;
  candidateId: string;
  displayName: string;
  fileName: string;
  path: string;
  themeId: string;
  createdAt: string;
};

type GenerateIconArtifactsInput = {
  artifactsDir?: string;
  candidates: AppCandidate[];
  jobId: string;
  theme: IconTheme;
};

const PNG_SIZE = 1024;

export async function generateIconArtifacts(input: GenerateIconArtifactsInput) {
  if (input.candidates.length === 0) {
    throw new Error("生成する確認済み候補がありません。");
  }

  const artifactsDir = input.artifactsDir ?? storagePaths.artifacts;
  const iconsDir = path.join(artifactsDir, "icons", input.jobId);
  const createdAt = new Date().toISOString();

  await mkdir(iconsDir, { recursive: true });

  const icons: GeneratedIcon[] = [];
  for (const candidate of input.candidates) {
    const fileName = `${createIconSlug(candidate)}.png`;
    const iconPath = path.join(iconsDir, fileName);
    const png = renderPngIcon(candidate, input.theme);

    await writeFile(iconPath, png);
    icons.push({
      id: `icon_${candidate.id}`,
      candidateId: candidate.id,
      createdAt,
      displayName: candidate.displayName,
      fileName,
      path: iconPath,
      themeId: input.theme.id
    });
  }

  return icons;
}

function renderPngIcon(candidate: AppCandidate, theme: IconTheme) {
  const [background, foreground, accent] = normalizePalette(theme.palette);
  const pixels = Buffer.alloc(PNG_SIZE * PNG_SIZE * 3);

  fillRect(pixels, 0, 0, PNG_SIZE, PNG_SIZE, background);
  fillDiagonalAccent(pixels, accent);
  fillRect(pixels, 116, 116, 792, 792, mixColor(background, [255, 255, 255], 0.18));
  drawInitials(pixels, getInitials(candidate), foreground, accent);

  return encodePng(PNG_SIZE, PNG_SIZE, pixels);
}

function normalizePalette(palette: string[]) {
  const colors = palette.map(parseHexColor);
  return [colors[0] ?? [247, 244, 236], colors[1] ?? [23, 23, 23], colors[2] ?? [216, 92, 58]] as const;
}

function parseHexColor(value: string): [number, number, number] {
  const match = value.match(/^#?([0-9a-f]{6})$/i);
  if (!match) {
    return [23, 23, 23];
  }

  const raw = match[1];
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16)
  ];
}

function fillRect(
  pixels: Buffer,
  x: number,
  y: number,
  width: number,
  height: number,
  color: readonly [number, number, number]
) {
  const maxX = Math.min(PNG_SIZE, x + width);
  const maxY = Math.min(PNG_SIZE, y + height);

  for (let row = Math.max(0, y); row < maxY; row += 1) {
    for (let column = Math.max(0, x); column < maxX; column += 1) {
      setPixel(pixels, column, row, color);
    }
  }
}

function fillDiagonalAccent(pixels: Buffer, color: readonly [number, number, number]) {
  for (let y = 0; y < PNG_SIZE; y += 1) {
    for (let x = 0; x < PNG_SIZE; x += 1) {
      if (x + y > 1280 || x - y > 570) {
        setPixel(pixels, x, y, color);
      }
    }
  }
}

function drawInitials(
  pixels: Buffer,
  initials: string,
  foreground: readonly [number, number, number],
  accent: readonly [number, number, number]
) {
  const letters = initials.slice(0, 2).toUpperCase();
  const scale = letters.length === 1 ? 72 : 56;
  const glyphWidth = 5 * scale;
  const totalWidth = letters.length * glyphWidth + Math.max(0, letters.length - 1) * scale;
  let x = Math.floor((PNG_SIZE - totalWidth) / 2);

  fillRect(pixels, 248, 716, 528, 42, accent);

  for (const letter of letters) {
    drawGlyph(pixels, letter, x, 344, scale, foreground);
    x += glyphWidth + scale;
  }
}

function drawGlyph(
  pixels: Buffer,
  letter: string,
  startX: number,
  startY: number,
  scale: number,
  color: readonly [number, number, number]
) {
  const rows = GLYPHS[letter] ?? GLYPHS["?"];
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "1") {
        fillRect(pixels, startX + x * scale, startY + y * scale, scale, scale, color);
      }
    });
  });
}

function setPixel(pixels: Buffer, x: number, y: number, color: readonly [number, number, number]) {
  const index = (y * PNG_SIZE + x) * 3;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
}

function encodePng(width: number, height: number, rgb: Buffer) {
  const scanlines = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const sourceStart = y * width * 3;
    const targetStart = y * (width * 3 + 1);
    scanlines[targetStart] = 0;
    rgb.copy(scanlines, targetStart + 1, sourceStart, sourceStart + width * 3);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", createIhdr(width, height)),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function createIhdr(width: number, height: number) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return ihdr;
}

function pngChunk(type: string, data: Buffer) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createIconSlug(candidate: AppCandidate) {
  const rawSlug = slugify(`${candidate.rawText} ${candidate.displayName}`);
  return rawSlug || slugify(candidate.id) || "icon";
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getInitials(candidate: AppCandidate) {
  const asciiWords = `${candidate.rawText} ${candidate.displayName}`.match(/[a-z0-9]+/gi);
  if (asciiWords?.length) {
    return asciiWords.slice(0, 2).map((word) => word[0]).join("");
  }

  const normalized = candidate.displayName.trim();
  return normalized ? "HI" : "IC";
}

function mixColor(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
  amount: number
): [number, number, number] {
  return [
    Math.round(first[0] * (1 - amount) + second[0] * amount),
    Math.round(first[1] * (1 - amount) + second[1] * amount),
    Math.round(first[2] * (1 - amount) + second[2] * amount)
  ];
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const GLYPHS: Record<string, string[]> = {
  "0": ["11111", "10001", "10011", "10101", "11001", "10001", "11111"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "11111"],
  "2": ["11110", "00001", "00001", "11110", "10000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01111", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "11110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["11111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "?": ["11111", "00001", "00010", "00100", "00100", "00000", "00100"]
};
