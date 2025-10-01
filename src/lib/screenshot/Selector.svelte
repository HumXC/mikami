<script lang="ts">
    let animationFrameId: number | null = null;
    let isDragging = false;
    let pointer = { x: 0, y: 0 };
    type Rectangle = { x: number; y: number; w: number; h: number };
    export let hasSelection = false;

    export let selection: Rectangle = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
    };
    export let visible = true;
    export let onstart: (x: number, y: number) => void = (x, y) => {};
    export let onstop: (rect: Rectangle) => void = (rect) => {};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    onmousedown={(e) => {
        if (e.button !== 0) return;
        isDragging = true;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        selection = {
            w: 0,
            h: 0,
            x: e.clientX,
            y: e.clientY,
        };
        onstart(e.clientX, e.clientY);
    }}
    onmousemove={(e) => {
        if (!isDragging || animationFrameId !== null) return;
        animationFrameId = requestAnimationFrame(() => {
            animationFrameId = null;
            let w = e.clientX - pointer.x + 1;
            let h = e.clientY - pointer.y + 1;
            selection = {
                w: Math.abs(w),
                h: Math.abs(h),
                x: Math.min(e.clientX, pointer.x),
                y: Math.min(e.clientY, pointer.y),
            };

            hasSelection = selection.w > 0 && selection.h > 0;
        });
    }}
    onmouseup={(e) => {
        if (e.button !== 0) return;
        isDragging = false;
        let w = e.clientX - pointer.x + 1;
        let h = e.clientY - pointer.y + 1;
        selection = {
            w: Math.abs(w),
            h: Math.abs(h),
            x: Math.min(e.clientX, pointer.x),
            y: Math.min(e.clientY, pointer.y),
        };
        hasSelection = selection.w > 0 && selection.h > 0;
        onstop(selection);
    }}
    draggable="false"
    class="absolute top-0 left-0 w-full h-full"
    style:cursor="crosshair"
    style:display={visible ? "block" : "none"}
>
    <div
        id="highlight"
        class="absolute z-50"
        style:width={selection.w + 1 + "px"}
        style:height={selection.h + 1 + "px"}
        style:left={selection.x - 1 + "px"}
        style:top={selection.y - 1 + "px"}
        style:opacity={hasSelection ? 1 : 0}
    ></div>
</div>

<style>
    #highlight {
        outline: 2px solid #fff;
        background-color: transparent;
        pointer-events: none;
    }
</style>
