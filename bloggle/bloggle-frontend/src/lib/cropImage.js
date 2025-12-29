const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getRadianAngle = (degree) => (degree * Math.PI) / 180;

const rotateSize = (width, height, rotation) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

export async function getCroppedBlob(
  imageSrc,
  pixelCrop,
  rotation = 0,
  { outputWidth, outputHeight, maxWidth = null, mimeType = "image/jpeg", quality = 0.9 } = {}
) {
  if (!pixelCrop) {
    throw new Error("Missing crop data.");
  }

  const image = await createImage(imageSrc);
  const rotRad = getRadianAngle(rotation);
  const { width: boundW, height: boundH } = rotateSize(image.width, image.height, rotation);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not available.");
  }

  canvas.width = Math.round(boundW);
  canvas.height = Math.round(boundH);

  ctx.translate(boundW / 2, boundH / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  ctx.rotate(-rotRad);
  ctx.translate(-boundW / 2, -boundH / 2);

  const cropX = Math.max(0, Math.round(pixelCrop.x));
  const cropY = Math.max(0, Math.round(pixelCrop.y));
  const cropW = Math.round(pixelCrop.width);
  const cropH = Math.round(pixelCrop.height);

  let targetW = cropW;
  let targetH = cropH;

  if (outputWidth && outputHeight) {
    targetW = outputWidth;
    targetH = outputHeight;
  } else if (maxWidth && cropW > maxWidth) {
    const ratio = maxWidth / cropW;
    targetW = Math.round(cropW * ratio);
    targetH = Math.round(cropH * ratio);
  }

  const output = document.createElement("canvas");
  output.width = targetW;
  output.height = targetH;
  const outCtx = output.getContext("2d");

  if (!outCtx) {
    throw new Error("Canvas not available.");
  }

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

  const blob = await new Promise((resolve) =>
    output.toBlob(resolve, mimeType, quality)
  );

  if (!blob) {
    throw new Error("Unable to crop image.");
  }

  return blob;
}
