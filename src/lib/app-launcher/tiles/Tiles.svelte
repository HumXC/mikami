<script lang="ts">
    import "gridstack/dist/gridstack.min.css";
    import { GridStack } from "gridstack";
    import { onMount } from "svelte";
    import { __initGrid, cellSize } from "./utils";
    let containerRef: HTMLDivElement;
    let grid: GridStack;
    export let onLoaded: () => void = () => {};
    function initGrid(e: HTMLElement) {
        // FIXME: 如果grid columns 为1，item的size会跟随窗口缩放而更改其 h,w
        grid = GridStack.addGrid(e, {
            float: true,
            resizable: { handles: "se" },
            draggable: { scroll: false },
            cellHeight: cellSize,
            minRow: 5,
            layout: "none",
            removable: ".tile-trash",
            acceptWidgets: (el) => true,
        });
        __initGrid(grid);
        onLoaded();
    }
    onMount(() => {
        const observer = new ResizeObserver(([entry]) => {
            const width = entry.contentRect.width;
            if (grid) {
                const column = Math.floor(width / cellSize);
                grid.column(column);
                grid.cellHeight(width / column);
                grid.batchUpdate(false);
            }
        });
        observer.observe(containerRef);

        return () => observer.disconnect();
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="grid-container w-full h-full" bind:this={containerRef}>
    <div use:initGrid>
        <!-- Use MountTile() to mount tiles -->
    </div>
</div>

<style>
    .grid-container {
        overflow-y: scroll;
        overflow-x: scroll;
    }
</style>
