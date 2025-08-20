<script lang="ts">
    import { layer, os } from "@mika-shell/core";
    // TODO: 尝试使用 div 代替 canvas 绘制选框
    import { onMount } from "svelte";
    import { CropImage, IsInRect, type Rectangle } from "./utils";
    import { Sleep } from "../../utils";
    let showToolbar = false;
    let imageElement: HTMLImageElement;
    let canvasElement: HTMLCanvasElement;
    let screenshot: string | null = null;
    let nextSelection: Rectangle | null = null;
    let selection: Rectangle = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
    let mousePos = {
        startX: -1,
        startY: -1,
        currentX: -1,
        currentY: -1,
    };
    let mouseDown = false;
    let cursor:
        | "default"
        | "crosshair"
        | "move"
        | "ew-resize"
        | "ns-resize"
        | "se-resize"
        | "sw-resize"
        | "ne-resize"
        | "nw-resize" = "crosshair";
    let toolbarRect: Rectangle = { x: 0, y: 0, width: 200, height: 60 };
    let nearLeft = false;
    let nearRight = false;
    let nearTop = false;
    let nearBottom = false;
    let isInSelection = false;
    layer.init({
        keyboardMode: "exclusive",
        namespace: "screenshot",
        anchor: ["bottom", "left", "right", "top"],
        layer: "top",
        autoExclusiveZone: false,
        backgroundTransparent: true,
        exclusiveZone: -1,
    });
    const main = async () => {
        await os.exec(["rm", "/tmp/screenshot.png"]);
        await os.exec([
            "sh",
            "-c",
            "grim /tmp/screenshot_tmp.png && mv /tmp/screenshot_tmp.png /tmp/screenshot.png",
        ]);
        for (let i = 0; i < 500; i++) {
            try {
                const data = await os.read("/tmp/screenshot.png");
                screenshot = `data:image/png;base64,${data}`;
                break;
            } catch {}
            await Sleep(20);
        }
    };
    main();
    const handleKeyDown = async (event: KeyboardEvent) => {
        if (event.code === "Escape") {
            event.stopPropagation();
            layer.close();
        }

        if (event.code === "Enter" || event.code === "Space") {
            console.log("Key pressed:", imageElement, selection);
            event.stopPropagation();
            if (!imageElement || !selection.width || !selection.height) return;
            const cropped = CropImage(imageElement, selection);
            if (cropped) {
                await os.write("/tmp/screenshot.png", cropped);
                await os.exec(["sh", "-c", "cat /tmp/screenshot.png | wl-copy -t image/png"]);
            }
            layer.close();
        }
        if (event.code === "F12") {
            event.stopPropagation();
            layer.openDevTools();
        }
    };
    const hasSelection = () => {
        return selection.width !== 0 && selection.height !== 0;
    };
    const handleCursorChange = (event: MouseEvent) => {
        if (mouseDown) return;
        const edgeWidth = 12;
        const x = event.clientX;
        const y = event.clientY;

        const left = selection.x;
        const right = selection.x + selection.width;
        const top = selection.y;
        const bottom = selection.y + selection.height;

        isInSelection = IsInRect(x, y, selection);

        nearLeft = x >= left - edgeWidth && x <= left + edgeWidth;
        nearRight = x >= right - edgeWidth && x <= right + edgeWidth;
        nearTop = y >= top - edgeWidth && y <= top + edgeWidth;
        nearBottom = y >= bottom - edgeWidth && y <= bottom + edgeWidth;
        const isInSelectionEdge = nearLeft || nearRight || nearTop || nearBottom;

        if (hasSelection()) {
            if (isInSelectionEdge) {
                if (nearLeft && nearTop) cursor = "nw-resize";
                else if (nearRight && nearTop) cursor = "ne-resize";
                else if (nearLeft && nearBottom) cursor = "sw-resize";
                else if (nearRight && nearBottom) cursor = "se-resize";
                else if (nearLeft || nearRight) cursor = "ew-resize";
                else if (nearTop || nearBottom) cursor = "ns-resize";
            } else if (!isInSelection) {
                cursor = "crosshair";
            } else {
                cursor = "default";
            }
        } else {
            cursor = "crosshair";
        }

        document.body.style.cursor = cursor;
    };

    onMount(() => {
        document.addEventListener("contextmenu", function (e) {
            e.preventDefault();
        });
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousemove", handleCursorChange);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousedown", handleMouseDown);
        const ro = new ResizeObserver((entries) => {
            canvasElement.width = entries[0].contentRect.width;
            canvasElement.height = entries[0].contentRect.height;
        });
        ro.observe(canvasElement);
    });

    function calculateToolbarPosition(
        image: { width: number; height: number },
        selection: Rectangle,
        toolbar: { width: number; height: number }
    ) {
        const centerX = selection.x + (selection.width + toolbar.width) / 2;
        const toolbarX = Math.max(
            0,
            Math.min(image.width - toolbar.width, centerX - toolbar.width / 2)
        );

        // 尝试放在选区底边外侧
        const bottomOutsideY = selection.y + selection.height;
        if (bottomOutsideY + toolbar.height <= image.height) {
            return { x: toolbarX, y: bottomOutsideY };
        }

        // 尝试放在选区顶边外侧
        const topOutsideY = selection.y - toolbar.height;
        if (topOutsideY >= 0) {
            return { x: toolbarX, y: topOutsideY };
        }

        // 尝试放在选区底边内侧
        const bottomInsideY = selection.y + selection.height - toolbar.height;
        if (bottomInsideY >= selection.y) {
            return { x: toolbarX, y: bottomInsideY };
        }

        // 最后放在选区顶边内侧
        return { x: toolbarX, y: selection.y };
    }

    function drawSelection(rect: Rectangle) {
        const ctx = canvasElement.getContext("2d")!;
        const width = canvasElement.width;
        const height = canvasElement.height;

        ctx.clearRect(0, 0, width, height);

        // 蒙版：填充整个区域为半透明黑色
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, width, height);

        // 清除选区，使其透明
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

        // 绘制白色实线选框
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.setLineDash([]); // 实线
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    const handleMouseDown = (event: MouseEvent) => {
        mousePos.startX = event.clientX;
        mousePos.startY = event.clientY;
        mousePos.currentX = event.clientX;
        mousePos.currentY = event.clientY;
        mouseDown = true;
        const edgeWidth = 0.3 * Math.min(selection.width, selection.height);
        nearTop = event.clientY - selection.y < edgeWidth;
        nearBottom = selection.y + selection.height - event.clientY < edgeWidth;
        nearLeft = event.clientX - selection.x < edgeWidth;
        nearRight = selection.x + selection.width - event.clientX < edgeWidth;
        if (isInSelection && cursor === "default" && event.buttons === 1) cursor = "move";
        if (isInSelection && cursor === "default" && event.buttons === 2) {
            if (nearLeft && nearTop) cursor = "nw-resize";
            else if (nearRight && nearTop) cursor = "ne-resize";
            else if (nearLeft && nearBottom) cursor = "sw-resize";
            else if (nearRight && nearBottom) cursor = "se-resize";
            else if (nearLeft || nearRight) cursor = "ew-resize";
            else if (nearTop || nearBottom) cursor = "ns-resize";
            else cursor = "move";
        }
    };

    const handleMouseUp = async (event: MouseEvent) => {
        mousePos.startX = -1;
        mousePos.startY = -1;
        mousePos.currentX = -1;
        mousePos.currentY = -1;
        mouseDown = false;
        if (nextSelection) {
            selection.x = nextSelection.x;
            selection.y = nextSelection.y;
            selection.width = nextSelection.width;
            selection.height = nextSelection.height;
            nextSelection = null;
        }

        const toolbarXY = calculateToolbarPosition(
            { width: imageElement.width, height: imageElement.height },
            selection,
            { width: toolbarRect.width, height: toolbarRect.height }
        );
        toolbarRect.x = toolbarXY.x;
        toolbarRect.y = toolbarXY.y;
    };
    const handleMouseMove = (event: MouseEvent) => {
        if (!mouseDown) return;
        const dx = event.clientX - mousePos.startX;
        const dy = event.clientY - mousePos.startY;
        mousePos.currentX = event.clientX;
        mousePos.currentY = event.clientY;
        const sel: Rectangle = {
            x: selection.x,
            y: selection.y,
            width: selection.width,
            height: selection.height,
        };
        nextSelection = sel;
        switch (cursor) {
            case "crosshair":
                if (event.buttons !== 1) return;
                sel.x = Math.min(mousePos.startX, mousePos.currentX);
                sel.y = Math.min(mousePos.startY, mousePos.currentY);
                sel.width = Math.abs(mousePos.currentX - mousePos.startX);
                sel.height = Math.abs(mousePos.currentY - mousePos.startY);
                break;
            case "move":
                sel.x += dx;
                sel.y += dy;
                break;
            case "ew-resize":
                if (nearLeft) {
                    sel.x += dx;
                    sel.width -= dx;
                } else {
                    sel.width += dx;
                }
                break;
            case "ns-resize":
                if (nearTop) {
                    sel.y += dy;
                    sel.height -= dy;
                } else {
                    sel.height += dy;
                }
                break;
            case "nw-resize":
                sel.x += dx;
                sel.y += dy;
                sel.width -= dx;
                sel.height -= dy;
                break;
            case "ne-resize":
                sel.y += dy;
                sel.width += dx;
                sel.height -= dy;
                break;
            case "sw-resize":
                sel.x += dx;
                sel.width -= dx;
                sel.height += dy;
                break;
            case "se-resize":
                sel.width += dx;
                sel.height += dy;
                break;
        }
        drawSelection(sel);
    };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative w-full h-full" draggable="false">
    <img
        class="w-full h-full object-contain"
        style="image-rendering: pixelated;"
        src={screenshot}
        style:opacity={screenshot ? 1 : 0}
        alt="Screenshot"
        bind:this={imageElement}
        draggable="false"
    />
    <canvas
        draggable="false"
        bind:this={canvasElement}
        class="absolute top-0 left-0 w-full h-full"
        style="cursor: {cursor};"
    ></canvas>
    {#if showToolbar}
        <div
            draggable="false"
            class="toolbar overflow-hidden"
            style="width: {toolbarRect.width}px; height: {toolbarRect.height}px; left:{toolbarRect.x}px; top:{toolbarRect.y}px;"
        >
            <button draggable="false">保存</button>
            <button draggable="false">取消</button>
        </div>
    {/if}
</div>

<style>
    .toolbar {
        position: absolute;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        background-color: rgba(30, 30, 30, 0.8);
        padding: 10px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10;
    }

    .toolbar button {
        background: #ffffff;
        border: none;
        color: #000;
        padding: 6px 14px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
    }

    .toolbar button:hover {
        background: #e0e0e0;
    }
</style>
