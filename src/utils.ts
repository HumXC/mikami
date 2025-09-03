import { tick } from "svelte";
import type { TileOption } from "./lib/app-launcher/tiles/utils";
export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// container: 父元素，el: 子元素
// 将子元素滚动到可见区域
export async function ensureVisible(container: HTMLElement, el: HTMLElement) {
    await tick();
    // 获取相对位置
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const elTop = elRect.top - containerRect.top + container.scrollTop;
    const elBottom = elRect.bottom - containerRect.top + container.scrollTop;

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    if (elTop < containerTop) {
        // 元素在上方不可见
        container.scrollTo({ top: elTop, behavior: "smooth" });
    } else if (elBottom > containerBottom) {
        // 元素在下方不可见
        container.scrollTo({ top: elBottom - container.clientHeight, behavior: "smooth" });
    }
}
export class KeyController {
    private flag: boolean = false;
    private timer: number | null = null;
    constructor(private timeout: number = 300) {}
    public isInControl() {
        return this.flag;
    }
    public control() {
        this.flag = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.flag = false;
            this.timer = null;
        }, this.timeout);
    }
}
export function passControlKey(
    el: HTMLInputElement,
    keys: string[] = ["Enter", "ArrowDown", "ArrowUp", "Tab", "Escape"]
) {
    function handler(e: KeyboardEvent) {
        if (e.shiftKey || keys.includes(e.code)) {
            (e.target as HTMLInputElement).blur();
            e.preventDefault();
            e.stopPropagation();
            document.dispatchEvent(new KeyboardEvent("keydown", e));
        }
    }

    el.addEventListener("keydown", handler);

    return {
        destroy() {
            el.removeEventListener("keydown", handler);
        },
    };
}
