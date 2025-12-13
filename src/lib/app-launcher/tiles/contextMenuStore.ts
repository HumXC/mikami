import { writable } from "svelte/store";

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    tileId: string | null;
}

export const contextMenuStore = writable<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tileId: null,
});

export function showContextMenu(x: number, y: number, tileId: string) {
    contextMenuStore.set({
        visible: true,
        x,
        y,
        tileId,
    });
}

export function hideContextMenu() {
    contextMenuStore.set({
        visible: false,
        x: 0,
        y: 0,
        tileId: null,
    });
}
