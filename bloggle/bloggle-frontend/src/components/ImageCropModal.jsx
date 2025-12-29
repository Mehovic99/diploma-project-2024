import { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import Button from "./Button.jsx";
import { getCroppedBlob } from "../lib/cropImage.js";

const makeFileFromBlob = (blob, originalName, mimeType) => {
  const extension = mimeType.split("/")[1] || "jpg";
  const base = originalName ? originalName.replace(/\.[^/.]+$/, "") : "cropped";
  return new File([blob], `${base}.${extension}`, { type: mimeType });
};

export default function ImageCropModal({
  file,
  aspect,
  circularCrop = false,
  onCancel,
  onCropped,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspectValue, setAspectValue] = useState(aspect ?? 4 / 3);

  const imageSrc = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!imageSrc) return undefined;
    return () => URL.revokeObjectURL(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    if (typeof aspect === "number") {
      setAspectValue(aspect);
    }
  }, [aspect]);

  const handleCropComplete = (_, pixels) => {
    setCroppedAreaPixels(pixels);
  };

  const handleMediaLoaded = (mediaSize) => {
    if (typeof aspect === "number") return;
    if (mediaSize?.width && mediaSize?.height) {
      setAspectValue(mediaSize.width / mediaSize.height);
    }
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const mimeType = "image/jpeg";
    const output =
      circularCrop
        ? { outputWidth: 512, outputHeight: 512 }
        : { maxWidth: 1200 };

    const blob = await getCroppedBlob(
      imageSrc,
      croppedAreaPixels,
      rotation,
      { ...output, mimeType }
    );

    const croppedFile = makeFileFromBlob(blob, file?.name, mimeType);
    onCropped?.(croppedFile);
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl">
        <div className="relative w-full h-80 bg-black rounded-xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectValue}
            cropShape={circularCrop ? "round" : "rect"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
            onMediaLoaded={handleMediaLoaded}
          />
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-xs uppercase tracking-wider text-zinc-500">
              Zoom
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs uppercase tracking-wider text-zinc-500">
              Rotate
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={rotation}
              onChange={(event) => setRotation(Number(event.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-bold"
          >
            Cancel
          </button>
          <Button type="button" className="flex-1 py-3 text-base" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
