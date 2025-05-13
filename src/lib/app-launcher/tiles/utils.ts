import { mount } from "svelte";
import type { Application } from "../common";
import type { GridStack } from "gridstack";
import Tile from "./Tile.svelte";
type TileType = "app" | "folder";
type TileData = {
    app: Application;
    folder: string;
};

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
    const el = NewTile(tile);
    grid.makeWidget(el);
    return el;
}
function gridContainer(
    x: number,
    y: number,
    w: number,
    h: number
): [item: HTMLElement, content: HTMLElement] {
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
