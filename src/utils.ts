import type { TileOption } from "./lib/app-launcher/tiles/utils";
import { Config as Config_ } from "@humxc/mikami";
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
export async function SaveConfig() {
    await Config_.Write(Config);
}
export async function InitConfig() {
    const c = await Config_.Read();
    for (const key in Config) {
        if (c.hasOwnProperty(key)) {
            if (typeof Config[key as keyof ConfigType] === typeof c[key])
                Config[key as keyof ConfigType] = c[key];
        }
    }
}
