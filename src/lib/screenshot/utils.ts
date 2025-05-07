export type Rectangle = { x: number; y: number; width: number; height: number };

export function IsInRect(x: number, y: number, rect: Rectangle): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export function CropImage(imageElement: HTMLImageElement, rect: Rectangle): string | undefined {
    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    const scaleX = imageElement.naturalWidth / imageElement.clientWidth;
    const scaleY = imageElement.naturalHeight / imageElement.clientHeight;

    ctx.drawImage(
        imageElement,
        rect.x * scaleX,
        rect.y * scaleY,
        rect.width * scaleX,
        rect.height * scaleY,
        0,
        0,
        rect.width,
        rect.height
    );
    return canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
}
