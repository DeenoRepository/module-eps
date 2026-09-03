/**
 * Equipment Passport QR Code Generator & Parser
 * Generates ISO/IEC 18004 compliant QR matrices and SVG renders for thermal labels (58mm/80mm)
 * and digital passport verification.
 */

export interface EquipmentQrPayload {
  readonly schema: 'eps.v1';
  readonly equipmentId: string;
  readonly inventoryNumber: string;
  readonly serialNumber?: string;
  readonly name?: string;
  readonly verificationUrl?: string;
}

export interface GenerateQrPayloadOptions {
  readonly equipmentId: string;
  readonly inventoryNumber: string;
  readonly serialNumber?: string;
  readonly name?: string;
  readonly baseUrl?: string;
  readonly format?: 'uri' | 'json';
}

export interface EquipmentQrSvgOptions {
  readonly size?: number;
  readonly margin?: number;
  readonly foregroundColor?: string;
  readonly backgroundColor?: string;
  readonly title?: string;
}

export interface ThermalLabelOptions {
  readonly equipmentId: string;
  readonly inventoryNumber: string;
  readonly name: string;
  readonly serialNumber?: string;
  readonly location?: string;
  readonly labelFormat?: '58mm' | '80mm';
  readonly baseUrl?: string;
}

/**
 * Creates standardized text payload for Equipment Passport QR codes.
 */
export function formatEquipmentQrPayload(options: GenerateQrPayloadOptions): string {
  const { equipmentId, inventoryNumber, serialNumber, name, baseUrl, format = 'uri' } = options;

  if (format === 'json') {
    const payload: Record<string, string> = {
      schema: 'eps.v1',
      id: equipmentId,
      inv: inventoryNumber,
    };
    if (serialNumber) payload.sn = serialNumber;
    if (name) payload.name = name;
    return JSON.stringify(payload);
  }

  // Default format: canonical URI
  const root = (baseUrl || 'https://ems.platform.internal').replace(/\/+$/, '');
  const url = new URL(`${root}/eps/equipment/${encodeURIComponent(equipmentId)}`);
  url.searchParams.set('inv', inventoryNumber);
  if (serialNumber) {
    url.searchParams.set('sn', serialNumber);
  }
  return url.toString();
}

/**
 * Parses raw scanned QR string back into EquipmentQrPayload.
 */
export function parseEquipmentQrPayload(raw: string): EquipmentQrPayload | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // Try JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.schema === 'eps.v1' && (parsed.id || parsed.equipmentId) && (parsed.inv || parsed.inventoryNumber)) {
        return {
          schema: 'eps.v1',
          equipmentId: parsed.id || parsed.equipmentId,
          inventoryNumber: parsed.inv || parsed.inventoryNumber,
          serialNumber: parsed.sn || parsed.serialNumber || undefined,
          name: parsed.name || undefined,
        };
      }
    } catch {
      // Not valid JSON, continue to URL parsing
    }
  }

  // Try URL format
  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const eqIndex = pathParts.indexOf('equipment');
    const id = eqIndex !== -1 && pathParts[eqIndex + 1] ? decodeURIComponent(pathParts[eqIndex + 1]) : null;
    const inv = url.searchParams.get('inv');
    const sn = url.searchParams.get('sn') || undefined;

    if (id && inv) {
      return {
        schema: 'eps.v1',
        equipmentId: id,
        inventoryNumber: inv,
        serialNumber: sn,
        verificationUrl: trimmed,
      };
    }
  } catch {
    // Not valid URL
  }

  return null;
}

/* ========================================================================== */
/*                ISO/IEC 18004 Minimal Pure-TS QR Code Engine                */
/* ========================================================================== */

// Galois Field GF(256) arithmetic for Reed-Solomon EC
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGeneratorPoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], factor);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function calculateReedSolomon(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const result = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const feedback = data[i] ^ result[0];
    for (let j = 0; j < ecCount - 1; j++) {
      result[j] = result[j + 1] ^ gfMul(gen[j + 1], feedback);
    }
    result[ecCount - 1] = gfMul(gen[ecCount], feedback);
  }
  return result;
}

interface QrVersionInfo {
  version: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
}

const QR_VERSIONS: QrVersionInfo[] = [
  { version: 1, totalBytes: 26, dataBytes: 19, ecBytes: 7 },
  { version: 2, totalBytes: 44, dataBytes: 34, ecBytes: 10 },
  { version: 3, totalBytes: 70, dataBytes: 55, ecBytes: 15 },
  { version: 4, totalBytes: 100, dataBytes: 80, ecBytes: 20 },
  { version: 5, totalBytes: 134, dataBytes: 108, ecBytes: 26 },
  { version: 6, totalBytes: 172, dataBytes: 136, ecBytes: 36 },
];

function selectVersion(dataLen: number): QrVersionInfo {
  // Mode (4 bits) + Count (8 bits) = 12 bits -> 1.5 bytes + terminator (4 bits)
  const required = dataLen + 3;
  for (const v of QR_VERSIONS) {
    if (v.dataBytes >= required) return v;
  }
  throw new Error(`Payload exceeds supported QR code size for EPS passport (${dataLen} bytes)`);
}

/**
 * Generates boolean 2D matrix (true = dark, false = light) for given text.
 */
export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const vInfo = selectVersion(bytes.length);
  const v = vInfo.version;
  const size = 17 + 4 * v;

  // 1. Bitstream encoding: 8-bit byte mode (0100) + character count (8 bits) + bytes
  const bitArray: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitArray.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8); // Character count
  for (const b of bytes) {
    pushBits(b, 8);
  }
  // Terminator
  const maxDataBits = vInfo.dataBytes * 8;
  const terminatorLen = Math.min(4, maxDataBits - bitArray.length);
  for (let i = 0; i < terminatorLen; i++) bitArray.push(0);

  // Pad to byte
  while (bitArray.length % 8 !== 0) bitArray.push(0);

  // Pad bytes: 0xEC and 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitArray.length < maxDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to byte array
  const dataBytes = new Uint8Array(vInfo.dataBytes);
  for (let i = 0; i < vInfo.dataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitArray[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  // Calculate RS Error Correction
  const ecBytes = calculateReedSolomon(dataBytes, vInfo.ecBytes);

  // Total codeword sequence
  const allCodewords = new Uint8Array(vInfo.totalBytes);
  allCodewords.set(dataBytes, 0);
  allCodewords.set(ecBytes, vInfo.dataBytes);

  // Initialize Matrix: null = unassigned
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, isRes = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (isRes) reserved[r][c] = true;
    }
  };

  // 2. Finder patterns (7x7) + Separators
  const addFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isDark = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(nr, nc, isDark);
        } else {
          setModule(nr, nc, false); // Separator
        }
      }
    }
  };
  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // 3. Alignment pattern (if v >= 2)
  if (v >= 2) {
    const alignPos = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isDark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        setModule(alignPos + r, alignPos + c, isDark);
      }
    }
  }

  // 4. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const isDark = i % 2 === 0;
    if (matrix[6][i] === null) setModule(6, i, isDark);
    if (matrix[i][6] === null) setModule(i, 6, isDark);
  }

  // 5. Dark module
  setModule(4 * v + 9, 8, true);

  // Reserve format bits
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // 6. Data placement (snake traversal right-to-left)
  let bitIdx = 0;
  const totalBits = vInfo.totalBytes * 8;
  const getNextBit = (): boolean => {
    if (bitIdx >= totalBits) return false;
    const byte = allCodewords[Math.floor(bitIdx / 8)];
    const bit = (byte >> (7 - (bitIdx % 8))) & 1;
    bitIdx++;
    return bit === 1;
  };

  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const colList = [right, right - 1];
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const col of colList) {
        if (!reserved[row][col]) {
          const bitVal = getNextBit();
          // Apply standard mask 0: (row + col) % 2 === 0
          const masked = ((row + col) % 2 === 0) ? !bitVal : bitVal;
          matrix[row][col] = masked;
        }
      }
    }
    upward = !upward;
  }

  // 7. Format Information (Mask 0 + Error Level L: 0b01) -> Format string = 0x77c4
  // Format string for EC=L (01), Mask=0 (000): raw = 0b01000 = 8. BCH(15, 5) code = 0x77c4 ^ 0x5412
  const FORMAT_BITS = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0]; // Mask 0, ECC Level L
  for (let i = 0; i < 6; i++) matrix[8][i] = FORMAT_BITS[i] === 1;
  matrix[8][7] = FORMAT_BITS[6] === 1;
  matrix[8][8] = FORMAT_BITS[7] === 1;
  matrix[7][8] = FORMAT_BITS[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = FORMAT_BITS[i] === 1;

  for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = FORMAT_BITS[i] === 1;
  for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = FORMAT_BITS[i] === 1;

  return matrix.map((row) => row.map((cell) => cell === true));
}

/**
 * Generates an SVG string representation of the QR code.
 */
export function generateEquipmentQrSvg(text: string, options: EquipmentQrSvgOptions = {}): string {
  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const margin = options.margin ?? 4;
  const totalModules = matrixSize + margin * 2;
  const size = options.size ?? 256;
  const fg = options.foregroundColor ?? '#000000';
  const bg = options.backgroundColor ?? '#ffffff';
  const title = options.title ? `<title>${options.title}</title>` : '';

  let pathD = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        pathD += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${size}" height="${size}" shape-rendering="crispEdges">${title}<rect width="${totalModules}" height="${totalModules}" fill="${bg}"/><path d="${pathD.trim()}" fill="${fg}"/></svg>`;
}

/**
 * Generates ready-to-print SVG thermal label for industrial equipment tagging (58mm or 80mm).
 */
export function generateEquipmentThermalLabelSvg(options: ThermalLabelOptions): string {
  const {
    equipmentId,
    inventoryNumber,
    name,
    serialNumber,
    location,
    labelFormat = '58mm',
    baseUrl,
  } = options;

  const qrText = formatEquipmentQrPayload({
    equipmentId,
    inventoryNumber,
    serialNumber,
    baseUrl,
    format: 'uri',
  });

  const matrix = generateQrMatrix(qrText);
  const matrixSize = matrix.length;
  const qrMargin = 2;
  const totalModules = matrixSize + qrMargin * 2;

  let pathD = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        pathD += `M${c + qrMargin},${r + qrMargin}h1v1h-1z `;
      }
    }
  }

  const is80 = labelFormat === '80mm';
  const width = is80 ? 320 : 240;
  const height = is80 ? 240 : 180;
  const qrSize = is80 ? 120 : 90;
  const qrX = (width - qrSize) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff" stroke="#e0e0e0" rx="6" />
  <text x="${width / 2}" y="18" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#333333" text-anchor="middle" letter-spacing="1">EMS ENTERPRISE EPS</text>
  <line x1="16" y1="24" x2="${width - 16}" y2="24" stroke="#cccccc" stroke-width="1" />
  <svg x="${qrX}" y="28" width="${qrSize}" height="${qrSize}" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges">
    <rect width="${totalModules}" height="${totalModules}" fill="#ffffff"/>
    <path d="${pathD.trim()}" fill="#000000"/>
  </svg>
  <text x="${width / 2}" y="${28 + qrSize + 16}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#111111" text-anchor="middle">${inventoryNumber}</text>
  <text x="${width / 2}" y="${28 + qrSize + 30}" font-family="Arial, sans-serif" font-size="9" fill="#555555" text-anchor="middle">${name.slice(0, 32)}</text>
  ${serialNumber ? `<text x="${width / 2}" y="${28 + qrSize + 42}" font-family="Arial, sans-serif" font-size="8" fill="#777777" text-anchor="middle">S/N: ${serialNumber}</text>` : ''}
  ${location ? `<text x="${width / 2}" y="${28 + qrSize + 52}" font-family="Arial, sans-serif" font-size="8" fill="#888888" text-anchor="middle">${location.slice(0, 30)}</text>` : ''}
</svg>`;
}
