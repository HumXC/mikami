<script lang="ts">
    import "gridstack/dist/gridstack.min.css";
    import { GridStack } from "gridstack";
    import { onMount } from "svelte";
    import { __initGrid, cellSize, MountTile, type TileOption } from "./utils";
    let containerRef: HTMLDivElement;
    let grid: GridStack | null = null;
    let height = 0;
    const padding = 16;

    const tiles = JSON.parse(localStorage.getItem("app-launcher-tiles") || "[]");
    function updateTile(el: HTMLElement) {
        const w = el.getAttribute("gs-w");
        const h = el.getAttribute("gs-h");
        const x = el.getAttribute("gs-x");
        const y = el.getAttribute("gs-y");
        const id = el.getAttribute("data-tile-id");

        if (!id) {
            console.error("data-tile-id not found", el);
            return;
        }
        const tile = tiles[parseInt(id)];
        if (!tile) {
            console.error("tile not found", id);
            return;
        }
        tile.w = parseInt(w || "1");
        tile.h = parseInt(h || "1");
        tile.x = parseInt(x || "0");
        tile.y = parseInt(y || "0");
    }
    function initGrid(e: HTMLElement, cellSize: number, width: number, height: number) {
        grid = GridStack.addGrid(e, {
            float: true,
            resizable: { handles: "se" },
            cellHeight: cellSize,
            layout: "compact",
            removable: ".tile-trash",
            animate: false,
            acceptWidgets: (el) => true,
        });
        function keepGridHeight() {
            requestAnimationFrame(() => {
                // @ts-ignore
                grid.el.style["min-height"] = `${height - padding * 2}px`;
            });
        }

        const column = Math.floor(width / cellSize);
        grid.column(column);
        keepGridHeight();
        __initGrid(grid);
        for (let i = 0; i < tiles.length; i++) {
            MountTile(tiles[i], i);
        }
        grid.setAnimation(true, true);

        grid.on("change", (e, nodes) => {
            nodes.forEach((node) => {
                updateTile(node.el!);
            });
            keepGridHeight();
            localStorage.setItem("app-launcher-tiles", JSON.stringify(tiles));
        });
        grid.on("drag", () => keepGridHeight());
        grid.on("dragstart", () => keepGridHeight());
        grid.on("dragstop", () => keepGridHeight());
        grid.on("removed", (e, nodes) => {
            if (nodes.length > 1) {
                console.error("multiple nodes added, don't know what to do", nodes);
                return;
            }
            const node = nodes[0];
            const id = node.el!.getAttribute("data-tile-id")!;
            const index = parseInt(id);
            tiles.splice(index, 1);
            keepGridHeight();
            localStorage.setItem("app-launcher-tiles", JSON.stringify(tiles));
        });

        grid.on("added", (e, nodes) => {
            if (nodes.length > 1) {
                console.error("multiple nodes added, don't know what to do", nodes);
                return;
            }
            const node = nodes[0];
            if (node.el!.getAttribute("data-tile-id") !== null) {
                return;
            }
            const content = node.el!.querySelector(".tile")!;

            const appEntryId = content.getAttribute("data-app-entry-id")!;
            const tile: TileOption = {
                x: node.x || 0,
                y: node.y || 0,
                w: node.w || 1,
                h: node.h || 1,
                type: "app",
                data: appEntryId,
            };
            node.el!.setAttribute("data-tile-id", tiles.length);
            tiles.push(tile);
            keepGridHeight();
            localStorage.setItem("app-launcher-tiles", JSON.stringify(tiles));
        });
    }

    onMount(() => {
        const observer = new ResizeObserver(() => {
            const rect = containerRef.getBoundingClientRect();
            requestAnimationFrame(() => {
                if (grid) {
                    grid.destroy(true);
                    initGrid(containerRef, cellSize, rect.width, rect.height);
                } else {
                    initGrid(containerRef, cellSize, rect.width, rect.height);
                }
            });
        });
        observer.observe(containerRef);
        return () => observer.disconnect();
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="grid-container w-full h-full"
    style:padding={padding + "px"}
    bind:this={containerRef}
></div>

<style>
    .grid-container {
        overflow-y: scroll;
        overflow-x: scroll;
    }
</style>
