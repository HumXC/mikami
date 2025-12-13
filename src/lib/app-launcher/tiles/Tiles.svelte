<script lang="ts">
    import "gridstack/dist/gridstack.min.css";
    import { GridStack } from "gridstack";
    import { onMount } from "svelte";
    import { cellSize, NewTile, type TileOption } from "./utils";

    let containerRef: HTMLDivElement;
    let pagesContainerRef: HTMLDivElement;
    let grids: GridStack[] = [];
    let currentPage: number;
    let minPage = 0;
    let maxPage = 0;
    const padding = 16;
    const indicatorPadding = 40; // 底部指示器的空间

    const tiles: TileOption[] = JSON.parse(localStorage.getItem("app-launcher-tiles") || "[]");

    // 根据 tiles 推导页码范围，保证 0 页总是包含在范围内
    function initPageRange() {
        const pages = tiles.length === 0 ? [0] : tiles.map((t) => t.page || 0);
        return {
            minPage: Math.min(...pages, 0),
            maxPage: Math.max(...pages, 0),
        };
    }

    const pageRange = initPageRange();
    minPage = pageRange.minPage;
    maxPage = pageRange.maxPage;
    currentPage = 0;

    // 计算总页数
    $: totalPages = maxPage - minPage + 1;
    function MountTile(grid: GridStack, tile: TileOption, id: number) {
        if (!grid) {
            throw new Error("Grid not initialized");
        }
        if (!grid.willItFit({ x: tile.x, y: tile.y, w: tile.w, h: tile.h })) {
            console.warn("Not enough free space to place the widget on the grid", tile);
            return;
        }
        const item = NewTile(tile);
        item.setAttribute("data-tile-id", id.toString());
        return grid.makeWidget(item);
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

    function createGridElement() {
        const gridEl = document.createElement("div");
        gridEl.classList.add("grid-container");
        gridEl.style.minWidth = "100%";
        gridEl.style.flexShrink = "0";
        return gridEl;
    }

    function saveTiles() {
        localStorage.setItem("app-launcher-tiles", JSON.stringify(tiles));
    }

    function updatePageRange() {
        if (tiles.length === 0) {
            minPage = 0;
            maxPage = 0;
            currentPage = 0;
            return;
        }

        const pages = tiles.map((t) => t.page || 0);
        const newMinPage = Math.min(...pages, 0);
        const newMaxPage = Math.max(...pages, 0);

        minPage = newMinPage;
        maxPage = newMaxPage;
        // 确保当前页在范围内
        if (currentPage < minPage) {
            currentPage = minPage;
        } else if (currentPage > maxPage) {
            currentPage = maxPage;
        }
    }

    let transitionsEnabled = false;

    function scrollToPage(pageIndex: number, animate = true) {
        if (!pagesContainerRef) return;
        // 使用单页的实际宽度，避免 padding 造成的偏移误差
        const pageWidth =
            pagesContainerRef.firstElementChild?.getBoundingClientRect().width ||
            Math.max(containerRef.clientWidth - padding * 2, 0);
        const offset = pageIndex - minPage;

        if (!animate) {
            pagesContainerRef.style.transition = "none";
        } else if (transitionsEnabled) {
            pagesContainerRef.style.transition = "transform 300ms ease-out";
        }

        pagesContainerRef.style.transform = `translateX(-${offset * pageWidth}px)`;
        currentPage = pageIndex;

        if (!animate) {
            requestAnimationFrame(() => {
                transitionsEnabled = true;
                pagesContainerRef.style.transition = "transform 300ms ease-out";
            });
        }
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
        if (dir === 0) return;

        // 先尝试在现有页面范围内翻页
        if (dir > 0 && currentPage < maxPage) {
            scrollToPage(currentPage + 1);
            return;
        }
        if (dir < 0 && currentPage > minPage) {
            scrollToPage(currentPage - 1);
            return;
        }

        // 边界页，需创建新页。只有当前页有内容才允许创建。
        const hasTiles = tiles.some((t) => (t.page || 0) === currentPage);
        if (!hasTiles) return;

        const rect = containerRef.getBoundingClientRect();

        if (dir > 0) {
            // 右侧追加新页
            maxPage += 1;
            const gridEl = createGridElement();
            pagesContainerRef.appendChild(gridEl);
            const grid = initGrid(maxPage, gridEl, cellSize, rect.width, rect.height);
            grids.push(grid);
            scrollToPage(maxPage);
        } else {
            // 左侧新增新页（页号为 minPage - 1），插到最前面
            // 1. 需要先计算当前的页面宽度
            const pageWidth =
                pagesContainerRef.firstElementChild?.getBoundingClientRect().width ||
                Math.max(containerRef.clientWidth - padding * 2, 0);
            // 2. 将 minPage 下移一位
            minPage -= 1;
            // 3. 插入新页面元素
            const gridEl = createGridElement();
            pagesContainerRef.insertBefore(gridEl, pagesContainerRef.firstChild);
            const grid = initGrid(minPage, gridEl, cellSize, rect.width, rect.height);
            grids.unshift(grid);
            // 4. 插入后，候选框已经变化了，需要加一个pageWidth的偏移来抵消插入的影响，以保持子帵可见区域不合；然后再滚动到新页面
            if (transitionsEnabled) {
                pagesContainerRef.style.transition = "none";
            }
            pagesContainerRef.style.transform = `translateX(-${pageWidth}px)`;
            // 5. 在下一帧启用动画并滚动到新页面
            requestAnimationFrame(() => {
                if (transitionsEnabled) {
                    pagesContainerRef.style.transition = "transform 300ms ease-out";
                }
                scrollToPage(minPage);
            });
        }
    }

    function reinitAllGrids() {
        // 销毁所有现有grids
        grids.forEach((g) => g.destroy(true));
        grids = [];

        // 清空容器
        if (pagesContainerRef) {
            pagesContainerRef.innerHTML = "";
        }

        // 重新创建所有grids
        const rect = containerRef.getBoundingClientRect();
        for (let i = minPage; i <= maxPage; i++) {
            const gridEl = createGridElement();
            pagesContainerRef.appendChild(gridEl);
            const grid = initGrid(i, gridEl, cellSize, rect.width, rect.height);
            grids.push(grid);
        }
    }
    function initGrid(
        pageIndex: number,
        gridEl: HTMLElement,
        cellSize: number,
        width: number,
        height: number
    ) {
        const grid = GridStack.addGrid(gridEl, {
            float: true,
            draggable: { handle: ".tile" },
            resizable: { handles: "se" },
            cellHeight: cellSize,
            layout: "compact",
            removable: ".tile-trash",
            animate: false,
            maxRow: Math.floor((height - indicatorPadding) / cellSize),
            acceptWidgets: (el) => true,
        });

        function keepGridHeight() {
            requestAnimationFrame(() => {
                // @ts-ignore
                grid.el.style["min-height"] = `${height - padding * 2 - indicatorPadding}px`;
            });
        }

        const column = Math.floor(width / cellSize);
        grid.column(column);
        grid.resizable("all", true);
        keepGridHeight();

        // 加载该页面的tiles
        const pageTiles = tiles.filter((t) => (t.page || 0) === pageIndex);
        pageTiles.forEach((tile) => {
            const tileId = tiles.indexOf(tile);
            MountTile(grid, tile, tileId);
        });

        grid.setAnimation(true, true);

        grid.on("change", (e, nodes) => {
            nodes.forEach((node) => {
                updateTile(node.el!);
            });
            keepGridHeight();
            saveTiles();
        });

        grid.on("drag", () => keepGridHeight());
        grid.on("dragstart", () => keepGridHeight());
        grid.on("dragstop", () => keepGridHeight());

        grid.on("removed", (e, nodes) => {
            if (nodes.length > 1) {
                console.error("multiple nodes removed, don't know what to do", nodes);
                return;
            }
            const node = nodes[0];
            const id = node.el!.getAttribute("data-tile-id")!;
            const index = parseInt(id);
            tiles.splice(index, 1);
            keepGridHeight();
            saveTiles();
            updatePageRange();
        });

        grid.on("added", (e, nodes) => {
            if (nodes.length > 1) {
                console.error("multiple nodes added, don't know what to do", nodes);
                return;
            }
            const node = nodes[0];
            // 被拖动而新增的节点，没有data-tile-id属性
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
                page: pageIndex,
                type: "app",
                data: appEntryId,
            };
            node.el!.setAttribute("data-tile-id", tiles.length.toString());
            tiles.push(tile);
            keepGridHeight();
            saveTiles();
        });

        return grid;
    }

    onMount(() => {
        const observer = new ResizeObserver(() => {
            const rect = containerRef.getBoundingClientRect();
            requestAnimationFrame(() => {
                reinitAllGrids();
                scrollToPage(currentPage, false);
            });
        });
        observer.observe(containerRef);

        // 初始化grids
        reinitAllGrids();
        scrollToPage(currentPage, false);

        return () => {
            observer.disconnect();
            grids.forEach((g) => g.destroy(true));
        };
    });
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="w-full h-full overflow-hidden flex flex-col"
    style:padding={padding + "px"}
    bind:this={containerRef}
    on:wheel={handleWheel}
>
    <div class="flex-1 overflow-hidden relative">
        <div bind:this={pagesContainerRef} class="flex h-full">
            <!-- Grids will be inserted here -->
        </div>
    </div>

    <!-- 页码指示器 -->
    <div class="flex justify-center items-center gap-2 py-2">
        {#each Array(totalPages) as _, i}
            {@const pageNum = minPage + i}

            <button
                class="w-2 h-2 rounded-full transition-all duration-200"
                class:bg-white={pageNum === currentPage}
                class:bg-gray-500={pageNum !== currentPage}
                class:scale-125={pageNum === currentPage}
                on:click={() => scrollToPage(pageNum)}
            />
        {/each}
    </div>
</div>
