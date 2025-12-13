import { mount } from "svelte";
import { GridStack } from "gridstack";
import Tile from "./Tile.svelte";
type TileType = "app";
type TileData = {
    app: string;
};
export const cellSize = 60;

export interface TileOption {
    x: number;
    y: number;
    w: number;
    h: number;
    page: number;
    type: TileType;
    data: TileData[TileType];
}
function createGridItem(
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
    const [item, content] = createGridItem(tile.x, tile.y, tile.w, tile.h);
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
        const entryId = ee.getAttribute("data-app-entry-id");
        if (!entryId) {
            throw new Error("Invalid data-app-entry-id");
        }
        const tile: TileOption = {
            x: 0,
            y: 0,
            w: 2,
            h: 2,
            // TODO
            page: 0,
            type: "app",
            data: entryId,
        };
        const newEl = NewTile(tile);
        return newEl;
    };
    GridStack.setupDragIn([e], { helper });
}
