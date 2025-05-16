<script lang="ts">
    import "gridstack/dist/gridstack.min.css";
    import { GridStack } from "gridstack";
    import { onMount } from "svelte";
    import { __initGrid, cellSize, type TileOption } from "./utils";
    import { Config, SaveConfig } from "../../../utils";
    let containerRef: HTMLDivElement;
    let grid: GridStack;
    let width: number = 0;
    let height: number = 0;
    export let onLoaded: () => void = () => {};
    function keepGridHeight() {
        // @ts-ignore
        grid.el.style["min-height"] = `${height}px`;
    }
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
        const tile = Config["app-launcher"].tiles[parseInt(id)];
        if (!tile) {
            console.error("tile not found", id);
            return;
        }
        tile.w = parseInt(w || "1");
        tile.h = parseInt(h || "1");
        tile.x = parseInt(x || "0");
        tile.y = parseInt(y || "0");
    }
    // FIXME: 第一个加载的 Tile 没动画
    function initGrid(e: HTMLElement) {
        // FIXME: 如果grid columns 为1，item的size会跟随窗口缩放而更改其 h,w
        grid = GridStack.addGrid(e, {
            float: true,
            resizable: { handles: "se" },
            cellHeight: cellSize,
            layout: "compact",
            removable: ".tile-trash",
            acceptWidgets: (el) => true,
        });

        grid.on("change", (e, nodes) => {
            nodes.forEach((node) => {
                updateTile(node.el!);
            });
            keepGridHeight();
            SaveConfig();
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
            Config["app-launcher"].tiles.splice(index, 1);
            keepGridHeight();
            SaveConfig();
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

            const appEntryPath = content.getAttribute("data-app-entry-path")!;
            const tile: TileOption = {
                x: node.x || 0,
                y: node.y || 0,
                w: node.w || 1,
                h: node.h || 1,
                type: "app",
                data: appEntryPath,
            };
            const id = `${Config["app-launcher"].tiles.length}`;
            node.el!.setAttribute("data-tile-id", id);
            Config["app-launcher"].tiles.push(tile);
            keepGridHeight();
            SaveConfig();
        });
        __initGrid(grid);
        onLoaded();
    }

    onMount(() => {
        const observer = new ResizeObserver(([entry]) => {
            width = entry.contentRect.width;
            height = entry.contentRect.height;
            if (grid) {
                const column = Math.floor(width / cellSize);
                grid.column(column);
                grid.cellHeight(width / column);
                keepGridHeight();
            }
        });
        observer.observe(containerRef);

        return () => observer.disconnect();
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="grid-container w-full h-full" use:initGrid bind:this={containerRef}></div>

<style>
    .grid-container {
        overflow-y: scroll;
        overflow-x: scroll;
    }
</style>
