import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { storagePaths } from "../storage/paths";
import type { GeneratedIcon } from "./icon-generator";
import { createShortcutSetupChecklist } from "./setup-checklist";

export type GeneratedIconArchive = {
  fileName: string;
  path: string;
};

type CreateStoredZipArchiveInput = {
  artifactsDir?: string;
  icons: GeneratedIcon[];
  jobId: string;
};

type ZipEntry = {
  data: Buffer;
  name: string;
};

export async function createStoredZipArchive(input: CreateStoredZipArchiveInput): Promise<GeneratedIconArchive> {
  if (input.icons.length === 0) {
    throw new Error("ZIP 化する生成済みアイコンがありません。");
  }

  const artifactsDir = input.artifactsDir ?? storagePaths.artifacts;
  const archiveDir = path.join(artifactsDir, "archives");
  const fileName = `home-icon-studio-${input.jobId}.zip`;
  const archivePath = path.join(archiveDir, fileName);
  const iconEntries = await Promise.all(
    input.icons.map(async (icon) => ({
      data: await readFile(icon.path),
      name: `icons/${icon.fileName}`
    }))
  );

  await mkdir(archiveDir, { recursive: true });
  await writeFile(
    archivePath,
    createZip([
      ...iconEntries,
      {
        data: Buffer.from(createSetupNotes(input.icons), "utf8"),
        name: "README.txt"
      }
    ])
  );

  return {
    fileName,
    path: archivePath
  };
}

function createSetupNotes(icons: GeneratedIcon[]) {
  const rows = icons.map((icon) => `- ${icon.displayName}: icons/${icon.fileName}`).join("\n");
  return (
    `Home Icon Studio export\n\nGenerated icons:\n${rows}\n\n` +
    `${createShortcutSetupChecklist(icons)}\n\n` +
    "Use these PNG files with Apple Shortcuts or your launcher setup.\n"
  );
}

function createZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fileName = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.data);
    const localHeader = createLocalHeader(fileName, entry.data.length, crc);
    localParts.push(localHeader, entry.data);
    centralParts.push(createCentralHeader(fileName, entry.data.length, crc, offset));
    offset += localHeader.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = createEndRecord(entries.length, centralDirectory.length, offset);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function createLocalHeader(fileName: Buffer, size: number, crc: number) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(size, 18);
  header.writeUInt32LE(size, 22);
  header.writeUInt16LE(fileName.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, fileName]);
}

function createCentralHeader(fileName: Buffer, size: number, crc: number, offset: number) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(size, 20);
  header.writeUInt32LE(size, 24);
  header.writeUInt16LE(fileName.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, fileName]);
}

function createEndRecord(count: number, centralSize: number, centralOffset: number) {
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  return end;
}

function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});
