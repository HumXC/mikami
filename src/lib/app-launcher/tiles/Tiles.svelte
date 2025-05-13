<script lang="ts">
    import "gridstack/dist/gridstack.min.css";
    import { GridStack } from "gridstack";
    import { onMount } from "svelte";
    import { __initGrid } from "./utils";
    let gridRef: HTMLDivElement;
    let cellSize = 100;
    let width = 0;
    let grid: GridStack;
    export let onLoaded: () => void = () => {};
    onMount(() => {
        grid = GridStack.init({
            float: true,
            resizable: { handles: "se" },
            draggable: { scroll: false },
            cellHeight: cellSize,
        });
        __initGrid(grid);
        onLoaded();
        const observer = new ResizeObserver(([entry]) => {
            width = entry.contentRect.width;
            if (width > 0) {
                const column = Math.floor(width / cellSize);
                grid.column(column);
            }
        });
        observer.observe(gridRef);

        return () => observer.disconnect();
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="grid-container w-full h-full">
    <div class="grid-stack w-full h-full" bind:this={gridRef}>
        <!-- Use MountTile() to mount tiles -->
    </div>
</div>

<style>
    .grid-container {
        white-space: nowrap;
        overflow-y: scroll;
        overflow-x: scroll;
        transform-origin: 0 0;
    }
    .grid-stack {
        overflow-x: scroll;
        overflow-y: hidden;
    }
</style>
