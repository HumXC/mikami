<script lang="ts">
    import { layer, os } from "@mika-shell/core";
    import { onMount } from "svelte";
    import { Sleep } from "../../utils";
    import hotkeys from "hotkeys-js";
    let canvasElement: HTMLCanvasElement;
    let isDrawn = false;
    type Rectangle = { x: number; y: number; w: number; h: number };

    const selection: Rectangle = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
    };
    layer.init({
        keyboardMode: "exclusive",
        namespace: "screenshot",
        anchor: ["bottom", "left", "right", "top"],
        layer: "top",
        autoExclusiveZone: false,
        backgroundTransparent: true,
        exclusiveZone: -1,
    });

    function CropImage(src: HTMLCanvasElement, rect: Rectangle, scale: number): string {
        const canvas = document.createElement("canvas");
        const x = rect.x * scale;
        const y = rect.y * scale;
        const w = rect.w * scale;
        const h = rect.h * scale;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
        return canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
    }
    hotkeys("esc", (e) => {
        e.stopPropagation();
        layer.close();
    });

    hotkeys("enter,space,ctrl+c,ctrl+a", (e) => {
        e.stopPropagation();
        if (e.ctrlKey && e.key === "a") {
            selection.x = 0;
            selection.y = 0;
            selection.w = canvasElement.width;
            selection.h = canvasElement.height;
        }
        (async () => {
            if (!hasSelection(selection)) return;

            if (isDrawn) {
                const cropped = CropImage(canvasElement, selection, await layer.getScale());
                await os.write("/tmp/screenshot.png", cropped);
                os.exec(["sh", "-c", "cat /tmp/screenshot.png | wl-copy -t image/png"]);
            } else {
                os.exec([
                    "sh",
                    "-c",
                    "grim /tmp/screenshot2.png && cat /tmp/screenshot2.png | wl-copy -t image/png",
                ]);
            }
        })().then(() => {
            layer.close();
        });
    });
    hotkeys("f12", (e) => {
        e.stopPropagation();
        layer.openDevTools();
    });
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
    onMount(async () => {
        const ro = new ResizeObserver((entries) => {
            const w = entries[0].contentRect.width;
            const h = entries[0].contentRect.height;

            canvasElement.width = w;
            canvasElement.height = h;
        });
        ro.observe(window.document.body);
        const img = new Image();
        await os.exec(["rm", "/tmp/screenshot.png"]);
        os.exec([
            "sh",
            "-c",
            "grim /tmp/screenshot_tmp.png && mv /tmp/screenshot_tmp.png /tmp/screenshot.png",
        ]);
        img.onload = async () => {
            const canvas = canvasElement;
            const ctx = canvasElement.getContext("2d")!;
            const cssWidth = canvasElement.width;
            const cssHeight = canvasElement.height;
            const dpr = await layer.getScale();

            // 设置 canvas 内部像素大小
            canvas.width = cssWidth * dpr;
            canvas.height = cssHeight * dpr;

            // CSS 显示大小不变
            canvas.style.width = cssWidth + "px";
            canvas.style.height = cssHeight + "px";

            // 缩放上下文，让绘制坐标和 CSS 尺寸一致
            ctx.scale(dpr, dpr);
            ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
            isDrawn = true;
        };
        for (let i = 0; i < 500; i++) {
            try {
                const data = await os.read("/tmp/screenshot.png");
                img.src = `data:image/png;base64,${data}`;
                break;
            } catch {}
            await Sleep(20);
        }
    });

    function hasSelection(selection: Rectangle) {
        return selection.w > 0 && selection.h > 0;
    }
    let animationFrameId: number | null = null;
    let isDragging = false;
    let pointer = { x: 0, y: 0 };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative w-full h-full" draggable="false">
    <canvas
        draggable="false"
        bind:this={canvasElement}
        class="absolute top-0 left-0 w-full h-full"
        style:cursor="crosshair"
        onmousedown={(e) => {
            isDragging = true;
            selection.w = 0;
            selection.h = 0;
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        }}
        onmousemove={(e) => {
            if (!isDragging || animationFrameId !== null) return;
            animationFrameId = requestAnimationFrame(() => {
                animationFrameId = null;
                let w = e.clientX - pointer.x + 1;
                let h = e.clientY - pointer.y + 1;
                selection.w = Math.abs(w);
                selection.h = Math.abs(h);
                selection.x = Math.min(e.clientX, pointer.x);
                selection.y = Math.min(e.clientY, pointer.y);
            });
        }}
        onmouseup={(e) => {
            isDragging = false;
        }}
    ></canvas>
    <div
        class="highlight absolute z-50"
        style:width={selection.w + 1 + "px"}
        style:height={selection.h + 1 + "px"}
        style:left={selection.x - 1 + "px"}
        style:top={selection.y - 1 + "px"}
        style:opacity={hasSelection(selection) ? 1 : 0}
    ></div>
</div>

<style>
    .highlight {
        outline: 2px solid #fff;
        background-color: transparent;
        pointer-events: none;
    }
</style>
