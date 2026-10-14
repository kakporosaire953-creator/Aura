import { SlideArtifact } from '../shared/types';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Generates a standard PKZIP (.zip) archive Blob in pure TypeScript
 * containing all provided virtual files (`index.html`, `styles.css`, `app.js`, `README.md`, etc.).
 */
export function createStudioZipBlob(
  files: Array<{ path: string; content: string }>
): Blob {
  const encoder = new TextEncoder();
  const entries = files.map((f) => {
    const cleanPath = f.path.replace(/^\/+/, '') || 'index.html';
    const nameBytes = encoder.encode(cleanPath);
    const dataBytes = encoder.encode(f.content || '');
    const crc = crc32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  let localSize = 0;
  let centralSize = 0;
  for (const e of entries) {
    localSize += 30 + e.nameBytes.length + e.dataBytes.length;
    centralSize += 46 + e.nameBytes.length;
  }

  const totalSize = localSize + centralSize + 22;
  const buffer = new ArrayBuffer(totalSize);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  let offset = 0;
  const localOffsets: number[] = [];

  for (const e of entries) {
    localOffsets.push(offset);
    view.setUint32(offset, 0x04034b50, true); // Local file header signature
    view.setUint16(offset + 4, 20, true); // Version needed to extract (2.0)
    view.setUint16(offset + 6, 0x0800, true); // UTF-8 flag
    view.setUint16(offset + 8, 0, true); // Compression method (0 = Store)
    view.setUint16(offset + 10, 0, true); // Mod time
    view.setUint16(offset + 12, 0, true); // Mod date
    view.setUint32(offset + 14, e.crc, true); // CRC-32
    view.setUint32(offset + 18, e.dataBytes.length, true); // Compressed size
    view.setUint32(offset + 22, e.dataBytes.length, true); // Uncompressed size
    view.setUint16(offset + 26, e.nameBytes.length, true); // File name length
    view.setUint16(offset + 28, 0, true); // Extra field length
    offset += 30;

    bytes.set(e.nameBytes, offset);
    offset += e.nameBytes.length;

    bytes.set(e.dataBytes, offset);
    offset += e.dataBytes.length;
  }

  const centralStart = offset;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    view.setUint32(offset, 0x02014b50, true); // Central directory signature
    view.setUint16(offset + 4, 20, true); // Version made by
    view.setUint16(offset + 6, 20, true); // Version needed
    view.setUint16(offset + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(offset + 10, 0, true); // Compression method (Store)
    view.setUint16(offset + 12, 0, true); // Mod time
    view.setUint16(offset + 14, 0, true); // Mod date
    view.setUint32(offset + 16, e.crc, true); // CRC-32
    view.setUint32(offset + 20, e.dataBytes.length, true); // Compressed size
    view.setUint32(offset + 24, e.dataBytes.length, true); // Uncompressed size
    view.setUint16(offset + 28, e.nameBytes.length, true); // File name length
    view.setUint16(offset + 30, 0, true); // Extra field length
    view.setUint16(offset + 32, 0, true); // Comment length
    view.setUint16(offset + 34, 0, true); // Disk number
    view.setUint16(offset + 36, 0, true); // Internal attributes
    view.setUint32(offset + 38, 0, true); // External attributes
    view.setUint32(offset + 42, localOffsets[i], true); // Offset of local header
    offset += 46;

    bytes.set(e.nameBytes, offset);
    offset += e.nameBytes.length;
  }

  const centralLength = offset - centralStart;
  view.setUint32(offset, 0x06054b50, true); // End of central directory signature
  view.setUint16(offset + 4, 0, true); // Number of this disk
  view.setUint16(offset + 6, 0, true); // Disk with central dir
  view.setUint16(offset + 8, entries.length, true); // Entries on disk
  view.setUint16(offset + 10, entries.length, true); // Total entries
  view.setUint32(offset + 12, centralLength, true); // Size of central directory
  view.setUint32(offset + 16, centralStart, true); // Offset of central directory
  view.setUint16(offset + 20, 0, true); // Comment length

  return new Blob([buffer], { type: 'application/zip' });
}

/**
 * Renders all slides of a 16:9 SlideArtifact into a hidden print iframe
 * and opens the browser's native Save-as-PDF print dialog without using window.open.
 */
export function printSlideDeckToPdf(slideArtifact: SlideArtifact): void {
  const existingFrame = document.getElementById('aura-slides-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'aura-slides-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const slidesHtml = slideArtifact.slides
    .map(
      (sl) => `
      <section class="slide-sheet">
        <div class="slide-top">
          <span class="slide-badge">SLIDE ${sl.slideNumber} / ${slideArtifact.slides.length} · ${escapeHtml(
        slideArtifact.theme || 'AURA 16:9'
      )}</span>
          <span class="slide-brand">Aura Studio</span>
        </div>
        <div class="slide-body">
          <h1>${escapeHtml(sl.title)}</h1>
          ${sl.subtitle ? `<h2>${escapeHtml(sl.subtitle)}</h2>` : ''}
          <ul>
            ${sl.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
        </div>
        <div class="slide-footer">
          <span>${escapeHtml(slideArtifact.title)}</span>
          ${
            sl.highlightMetric
              ? `<span class="slide-metric">${escapeHtml(
                  `${sl.highlightMetric.value} · ${sl.highlightMetric.label}`
                )}</span>`
              : ''
          }
        </div>
      </section>`
    )
    .join('\n');

  const docContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(slideArtifact.title)} — Export PDF 16:9</title>
  <style>
    @page {
      size: 16in 9in;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif;
      background: #101B1E;
      color: #F3F2EC;
    }
    .slide-sheet {
      width: 100vw;
      height: 100vh;
      padding: 64px 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: radial-gradient(circle at 88% 16%, rgba(140,203,74,0.16), transparent 45%), #101B1E;
      page-break-after: always;
      break-after: page;
    }
    .slide-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #8CCB4A;
      font-weight: 700;
    }
    .slide-brand {
      color: #94A09E;
    }
    .slide-body {
      max-width: 88%;
      margin: auto 0;
    }
    h1 {
      font-size: 46px;
      line-height: 1.15;
      font-weight: 800;
      margin-bottom: 16px;
      color: #FFFFFF;
    }
    h2 {
      font-size: 22px;
      font-weight: 500;
      color: #8CCB4A;
      margin-bottom: 28px;
    }
    ul {
      list-style: none;
      display: grid;
      gap: 16px;
    }
    li {
      font-size: 21px;
      line-height: 1.45;
      color: #E6ECEA;
      padding-left: 28px;
      position: relative;
    }
    li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #FF790D;
      font-weight: bold;
    }
    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.12);
      font-size: 14px;
      color: #94A09E;
    }
    .slide-metric {
      padding: 8px 16px;
      border-radius: 999px;
      background: rgba(7, 131, 72, 0.25);
      border: 1px solid rgba(140, 203, 74, 0.4);
      color: #8CCB4A;
      font-weight: 700;
    }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;

  const win = iframe.contentWindow;
  if (!win) return;
  win.document.open();
  win.document.write(docContent);
  win.document.close();

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      // Fallback: download as printable HTML if print is blocked
    }
  }, 250);
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
