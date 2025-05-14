import { mount } from "svelte";
import { apps, type Application } from "../common";
import { GridStack } from "gridstack";
import Tile from "./Tile.svelte";
type TileType = "app" | "folder";
type TileData = {
    app: Application;
    folder: string;
};
export const cellSize = 60;

let grid: GridStack | null = null;
export interface TileOption {
    x: number;
    y: number;
    w: number;
    h: number;
    type: TileType;
    data: TileData[TileType];
}
export function __initGrid(gridStack: GridStack) {
    grid = gridStack;
}
export function MountTile(tile: TileOption) {
    if (!grid) {
        throw new Error("Grid not initialized");
    }
    const item = NewTile(tile);
    return grid.makeWidget(item);
}
function gridContainer(
    x: number,
    y: number,
    w: number,
    h: number
): [item: HTMLElement, content: HTMLElement] {
    if (!grid) {
        throw new Error("Grid not initialized");
    }
    if (!grid.willItFit({ x, y, w, h })) {
        throw new Error("Not enough free space to place the widget on the grid");
    }
    const item = document.createElement("div");
    item.classList.add("grid-stack-item");
    item.setAttribute("gs-w", `${w}`);
    item.setAttribute("gs-h", `${h}`);
    item.setAttribute("gs-x", `${x}`);
    item.setAttribute("gs-y", `${y}`);
    const content = document.createElement("div");
    content.classList.add("grid-stack-item-content");
    item.appendChild(content);
    return [item, content];
}
export function NewTile(tile: TileOption) {
    if (!grid) {
        throw new Error("Grid not initialized");
    }
    const [item, content] = gridContainer(tile.x, tile.y, tile.w, tile.h);

    mount(Tile, {
        target: content,
        props: {
            tile,
        },
    });
    return item;
}
export function SetupDargAndDrop(e: HTMLElement) {
    const helper = (ee: HTMLElement) => {
        // FIXME: 拖放的元素和放置的元素具有不同的尺寸，这不对
        const id = ee.getAttribute("data-app-entry-path");
        if (!id) {
            throw new Error("Invalid data-app-entry-path");
        }

        const newEl = NewTile({
            x: 1,
            y: 1,
            w: 1,
            h: 1,
            type: "app",
            data: apps.get(id)!,
        });
        return newEl;
    };
    GridStack.setupDragIn([e], { helper });
}
