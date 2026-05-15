"use client";

export async function exportToPng(canvas: HTMLCanvasElement, fileName = "kaitori-pop.png") {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function copyPosterToClipboard(canvas: HTMLCanvasElement) {
  if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
    throw new Error("Clipboard image writing is not supported.");
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Failed to create image blob.");
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": blob
    })
  ]);
}
