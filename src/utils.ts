import type { TileOption } from "./lib/app-launcher/tiles/utils";
export async function Sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ConfigType {
    "app-launcher": {
        tiles: TileOption[];
    };
}
export const Config: ConfigType = {
    "app-launcher": {
        tiles: [],
    },
};
