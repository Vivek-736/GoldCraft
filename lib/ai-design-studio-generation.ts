import { UTApi, UTFile } from "uploadthing/server";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    default:
      return "png";
  }
}

function normalizeMimeType(rawMimeType: string) {
  return rawMimeType.split(";")[0]?.trim().toLowerCase() || "image/png";
}

function detectMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 8) {
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    if (isPng) {
      return "image/png";
    }
  }

  if (buffer.length >= 3) {
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    if (isJpeg) {
      return "image/jpeg";
    }
  }

  if (buffer.length >= 12) {
    const isWebp =
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";

    if (isWebp) {
      return "image/webp";
    }
  }

  const leadingText = buffer.subarray(0, 256).toString("utf8").trimStart().toLowerCase();

  if (leadingText.startsWith("<?xml") || leadingText.startsWith("<svg")) {
    return "image/svg+xml";
  }

  return null;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid image payload.");
  }

  const [, rawMimeType, base64Data] = match;
  const buffer = Buffer.from(base64Data, "base64");
  const normalizedMimeType = normalizeMimeType(rawMimeType);
  const detectedMimeType = detectMimeTypeFromBuffer(buffer);
  const mimeType = detectedMimeType ?? normalizedMimeType;

  return {
    mimeType,
    buffer,
  };
}

async function uploadBufferAsImage({
  buffer,
  mimeType,
  fileName,
}: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}) {
  const uploadResult = await utapi.uploadFiles(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    new UTFile([buffer], fileName, {
      type: mimeType,
    }),
  );

  if (uploadResult.error || !uploadResult.data) {
    throw new Error(uploadResult.error?.message ?? "Failed to upload the image.");
  }

  return uploadResult.data.ufsUrl;
}

export async function persistGeneratedOutputUrl(outputUrl: string) {
  if (!outputUrl.startsWith("data:")) {
    return outputUrl;
  }

  const { mimeType, buffer } = parseDataUrl(outputUrl);
  const extension = extensionForMimeType(mimeType);

  return uploadBufferAsImage({
    buffer,
    mimeType,
    fileName: `ai-design-${Date.now()}.${extension}`,
  });
}

export async function uploadSketchFile(file: File) {
  const uploadResult = await utapi.uploadFiles(file);

  if (uploadResult.error || !uploadResult.data) {
    throw new Error(uploadResult.error?.message ?? "Failed to upload the sketch.");
  }

  return {
    fileKey: uploadResult.data.key,
    fileName: uploadResult.data.name,
    fileUrl: uploadResult.data.ufsUrl,
  };
}