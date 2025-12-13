<script lang="ts">
    import { layer, monitor } from "@mika-shell/core";
    import { onMount } from "svelte";

    let canvasElement: HTMLCanvasElement;
    let maskCanvas: HTMLCanvasElement;
    type Rectangle = { x: number; y: number; w: number; h: number };

    let selection: Rectangle = { x: 0, y: 0, w: 0, h: 0 };
    let showMask = false;
    let maskRedrawId: number | null = null;
    const MASK_COLOR = "rgba(0, 0, 0, 0.5)";

    onMount(async () => {
        const ro = new ResizeObserver((entries) => {
            const w = entries[0].contentRect.width;
            const h = entries[0].contentRect.height;

            canvasElement.width = w;
            canvasElement.height = h;
            maskCanvas.width = w;
            maskCanvas.height = h;
            redrawMask();
        });
        ro.observe(window.document.body);
        const img = new Image();
        img.onload = async () => {
            const canvas = canvasElement;
            const ctx = canvasElement.getContext("2d")!;
            const cssWidth = canvasElement.width;
            const cssHeight = canvasElement.height;
            const dpr = await layer.getScale();

            // 设置 canvas 内部像素大小
            canvas.width = img.width;
            canvas.height = img.height;

            // CSS 显示大小不变
            canvas.style.width = cssWidth + "px";
            canvas.style.height = cssHeight + "px";

            // 缩放上下文，让绘制坐标和 CSS 尺寸一致
            ctx.scale(dpr, dpr);
            ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
            ready = true;
            while (task.length > 0) {
                const t = task.shift();
                t && t();
            }
        };
        monitor.capture(0, null, { encode: "png" }).then((src) => (img.src = src));
    });

    export let ready = false;

    function redrawMask() {
        // 使用 requestAnimationFrame 来优化频繁的绘制
        if (maskRedrawId !== null) return;

        maskRedrawId = requestAnimationFrame(() => {
            maskRedrawId = null;
            const ctx = maskCanvas.getContext("2d")!;
            const w = maskCanvas.width;
            const h = maskCanvas.height;

            // 清空画布
            ctx.clearRect(0, 0, w, h);

            if (!showMask) return;

            // 绘制半透明黑色遮罩（覆盖整个区域）
            ctx.fillStyle = MASK_COLOR;
            ctx.fillRect(0, 0, w, h);

            // 清除选框内部（变亮）
            if (selection.w > 0 && selection.h > 0) {
                ctx.clearRect(selection.x, selection.y, selection.w, selection.h);
            }
        });
    }

    export function setSelection(rect: Rectangle) {
        selection = rect;
        redrawMask();
    }

    export function setShowMask(show: boolean) {
        showMask = show;
        redrawMask();
    }

    function CropImage(src: HTMLCanvasElement, rect: Rectangle, scale: number): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        const x = rect.x * scale;
        const y = rect.y * scale;
        const w = rect.w * scale;
        const h = rect.h * scale;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
        return canvas;
    }

    let task: (() => void)[] = [];
    export async function crop(rect: Rectangle): Promise<HTMLCanvasElement> {
        const scale = await layer.getScale();
        return new Promise((resolve) => {
            if (!ready) {
                task.push(() => {
                    resolve(CropImage(canvasElement, rect, scale));
                });
            } else {
                resolve(CropImage(canvasElement, rect, scale));
            }
        });
    }
</script>

<canvas draggable="false" bind:this={canvasElement} class="absolute top-0 left-0 w-full h-full"
></canvas>
<canvas
    draggable="false"
    bind:this={maskCanvas}
    class="absolute top-0 left-0 w-full h-full pointer-events-none"
></canvas>
