<script lang="ts">
    import { layer, monitor } from "@mika-shell/core";
    import { onMount } from "svelte";
    import { sleep } from "../../utils";

    let canvasElement: HTMLCanvasElement;
    type Rectangle = { x: number; y: number; w: number; h: number };

    onMount(async () => {
        const ro = new ResizeObserver((entries) => {
            const w = entries[0].contentRect.width;
            const h = entries[0].contentRect.height;

            canvasElement.width = w;
            canvasElement.height = h;
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
