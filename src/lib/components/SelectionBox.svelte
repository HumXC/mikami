<script lang="ts">
    type Rectangle = { x: number; y: number; w: number; h: number };

    export let hasSelection = false;
    export let selection: Rectangle = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
    };
    export let visible = true;
    export let enableMask = false;
    export let mask: any = null;
    export let onstart: (x: number, y: number) => void = (x, y) => {};
    export let onstop: (rect: Rectangle) => void = (rect) => {};

    let animationFrameId: number | null = null;
    let isDragging = false;
    let pointer = { x: 0, y: 0 };

    // CSS 变量用于高性能渲染
    let cssVars = {
        "--select-x": "0px",
        "--select-y": "0px",
        "--select-w": "1px",
        "--select-h": "1px",
    };

    function updateSelection(x: number, y: number, w: number, h: number) {
        selection = {
            w,
            h,
            x,
            y,
        };

        if (enableMask && mask) {
            mask.setSelection(selection);
        }
    }

    function updateCssVars(x: number, y: number, w: number, h: number) {
        cssVars["--select-x"] = x - 1 + "px";
        cssVars["--select-y"] = y - 1 + "px";
        cssVars["--select-w"] = w + 1 + "px";
        cssVars["--select-h"] = h + 1 + "px";
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    onmousedown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = true;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        selection = {
            w: 0,
            h: 0,
            x: e.clientX,
            y: e.clientY,
        };
        updateCssVars(e.clientX, e.clientY, 0, 0);
        if (enableMask && mask) {
            mask.setShowMask(true);
            mask.setSelection(selection);
        }
        onstart(e.clientX, e.clientY);
    }}
    onmousemove={(e) => {
        if (!isDragging) return;
        e.preventDefault();

        if (animationFrameId !== null) return;
        animationFrameId = requestAnimationFrame(() => {
            animationFrameId = null;
            let w = e.clientX - pointer.x + 1;
            let h = e.clientY - pointer.y + 1;

            const minX = Math.min(e.clientX, pointer.x);
            const minY = Math.min(e.clientY, pointer.y);
            const absW = Math.abs(w);
            const absH = Math.abs(h);

            updateCssVars(minX, minY, absW, absH);
            hasSelection = absW > 0 && absH > 0;
            updateSelection(minX, minY, absW, absH);
        });
    }}
    onmouseup={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = false;
        let w = e.clientX - pointer.x + 1;
        let h = e.clientY - pointer.y + 1;
        const minX = Math.min(e.clientX, pointer.x);
        const minY = Math.min(e.clientY, pointer.y);
        const absW = Math.abs(w);
        const absH = Math.abs(h);

        hasSelection = absW > 0 && absH > 0;
        updateSelection(minX, minY, absW, absH);
        onstop(selection);
    }}
    draggable="false"
    class="absolute top-0 left-0 w-full h-full"
    style:cursor="crosshair"
    style:display={visible ? "block" : "none"}
    style={Object.entries(cssVars)
        .map(([k, v]) => `${k}: ${v}`)
        .join(";")}
>
    <div
        id="highlight"
        class="absolute z-50"
        style:width="var(--select-w)"
        style:height="var(--select-h)"
        style:left="var(--select-x)"
        style:top="var(--select-y)"
        style:opacity={hasSelection ? 1 : 0}
    ></div>
</div>

<style>
    :global(#highlight) {
        outline: 2px solid #fff;
        background-color: transparent;
        pointer-events: none;
        will-change: width, height, left, top;
    }
</style>
