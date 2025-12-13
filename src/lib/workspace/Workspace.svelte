<script lang="ts">
    import { icon, layer, monitor } from "@mika-shell/core";
    import { hyprland } from "@mika-shell/extra";
    import hotkeys from "hotkeys-js";
    import { AppWindow } from "lucide-svelte";
    import { onMount } from "svelte";
    const padding = 8;
    const HIDDEN_WIDTH = 2;
    const WIDTH = 270;
    const LAYER_WIDTH = WIDTH + padding * 5 + 4;
    const ENTER_DELAY = 120; // 鼠标进入后延迟显示的时间(毫秒)
    let SCALE = 1;
    let HEIGHT = 0;
    let closeTimer: number = 0;
    let enterTimer: number = 0;
    let box: HTMLDivElement;
    let isShow = false;
    let activeWorkspace: number;

    layer
        .init({
            keyboardMode: "none",
            anchor: ["bottom", "top", "right"],
            width: HIDDEN_WIDTH,
            layer: "top",
            backgroundTransparent: true,
        })
        .then(async () => {
            const monitor_ = await monitor.getCurrent();
            SCALE = WIDTH / monitor_.width;
            HEIGHT = Math.floor(monitor_.height * SCALE);
        });
    type Workspace = {
        id: number;
        clients: {
            x: number;
            y: number;
            w: number;
            h: number;
            floating: boolean;
            className: string;
        }[];
    };
    let ws: Workspace[] = [];
    const update = async () => {
        hyprland.command.activeworkspace().then((w) => {
            activeWorkspace = w.id;
        });
        const map: Map<number, Workspace> = new Map();
        let clients = await hyprland.command.clients();
        clients.sort((a, b) => {
            // 1. 非 floating 在前
            if (a.floating !== b.floating) {
                return Number(a.floating) - Number(b.floating);
            }

            // 2. 都是 floating 的情况 -> 按 focusHistoryID 排序
            if (a.floating && b.floating) {
                return b.focusHistoryID - a.focusHistoryID;
            }

            return 0; // 都是非 floating，保持原有顺序
        });
        clients.forEach((client) => {
            const id = client.workspace.id;
            if (!map.has(id)) {
                map.set(id, { id, clients: [] });
            }
            const workspace = map.get(id)!;
            let x = Math.floor(client.at[0] * SCALE);
            let y = Math.floor(client.at[1] * SCALE);
            let w = Math.floor(client.size[0] * SCALE);
            let h = Math.floor(client.size[1] * SCALE);

            // 浮动窗口需要裁切以防超出边界
            if (client.floating) {
                if (x < 0) {
                    w -= Math.abs(x);
                    x = 0;
                }
                if (y < 0) {
                    h -= Math.abs(y);
                    y = 0;
                }
                if (x + w > WIDTH) {
                    w = WIDTH - x;
                }
                if (y + h > HEIGHT) {
                    h = HEIGHT - y;
                }
            }
            if (x === 1 || y === 1) {
                w -= 1;
                h -= 1;
            }
            workspace.clients.push({
                x,
                y,
                w,
                h,
                floating: client.floating,
                className: client.class,
            });
            console.log(x, y, w, h);
        });
        ws = Array.from(map.values()).sort((a, b) => a.id - b.id);
    };
    onMount(async () => {
        window.addEventListener("mousemove", async () => {
            if (!isShow) {
                clearTimeout(enterTimer);
                enterTimer = setTimeout(() => {
                    isShow = true;
                    layer.setSize(LAYER_WIDTH, 0);
                    update();
                    layer.setKeyboardMode("exclusive");
                }, ENTER_DELAY);
            }
            clearTimeout(closeTimer);
        });
        box.addEventListener("mouseleave", () => {
            clearTimeout(closeTimer);
            clearTimeout(enterTimer);
            closeTimer = setTimeout(() => {
                layer.setSize(HIDDEN_WIDTH, 0);
                isShow = false;
                layer.setKeyboardMode("none");
            }, 100);
        });
    });
    const activate = (id: number) => {
        return () => {
            hyprland.command.dispatch("workspace", id.toString());
            activeWorkspace = id;
        };
    };
    const desktopEntrys = JSON.parse(localStorage.getItem("app-launcher-apps") || "[]");
    hotkeys("tab", (e) => {
        e.preventDefault();
        for (let i = 0; i < ws.length; i++) {
            if (ws[i].id === activeWorkspace) {
                activate(ws[(i + 1) % ws.length].id)();
                break;
            }
        }
    });
    const getIcon = async (className: string) => {
        try {
            return await icon.lookup(className.toLowerCase(), 256);
        } catch {
            for (const app of desktopEntrys) {
                if (app.id === className) {
                    return app.iconData;
                }
            }
        }
        throw new Error("icon not found");
    };

    // Svelte action: 如果文本被裁切（scrollWidth > clientWidth），则隐藏该文本节点
    function hideIfOverflow(node: HTMLElement) {
        const update = () => {
            // 使用 requestAnimationFrame 防止测量抖动
            requestAnimationFrame(() => {
                try {
                    node.style.display = node.scrollWidth > node.clientWidth ? "none" : "";
                } catch {
                    // ignore for safety
                }
            });
        };

        const ro = new ResizeObserver(update);
        ro.observe(node);
        // 也观察父元素的尺寸变化，父元素变化可能导致文本被裁切
        if (node.parentElement) ro.observe(node.parentElement);

        // 初始检查
        update();

        return {
            destroy() {
                ro.disconnect();
            },
        };
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="w-full h-full transition-opacity duration-120 ease-in-out"
    style:opacity={isShow ? 1 : 0}
    style:padding="{padding}px {padding}px {padding}px 0"
>
    <div
        style:padding="{padding * 2}px"
        class="contianer w-full h-full flex flex-col gap-4 overflow-auto rounded-xl"
        bind:this={box}
    >
        {#each ws as workspace (workspace.id)}
            <div
                class="workspace relative w-full flex-shrink-0 border-0 rounded-sm"
                style:height="{HEIGHT}px"
                style:width="{WIDTH}px"
                class:active={workspace.id === activeWorkspace}
                onclick={activate(workspace.id)}
            >
                {#each workspace.clients as client}
                    <div
                        class="client absolute"
                        class:floating={client.floating}
                        style:left="{client.x}px"
                        style:top="{client.y}px"
                        style:width="{client.w}px"
                        style:height="{client.h}px"
                    >
                        <div class="w-full h-full flex flex-col justify-center items-center">
                            {#await getIcon(client.className)}
                                <AppWindow size={32} />
                            {:then icon}
                                <img
                                    src={icon}
                                    alt={client.className}
                                    class="w-[32px] h=[32px] object-contain"
                                />
                            {:catch e}
                                <AppWindow size={32} />
                            {/await}
                            <span
                                use:hideIfOverflow
                                class="w-full text-center pl-2 pr-2 text-white whitespace-nowrap overflow-hidden text-ellipsis"
                                >{client.className}</span
                            >
                        </div>

                        <!-- overlay for hover highlight / quick affordance (no floating) -->
                        <div class="client-overlay" aria-hidden="true"></div>
                    </div>
                {/each}
                <span class=" absolute bottom-0 left-0 text-xl font-bold p-2">{workspace.id}</span>
            </div>
        {/each}
        <div
            class="workspace w-full flex-shrink-0 flex flex-col border-0 rounded-sm justify-center items-center text-xl"
            style:height="{HEIGHT}px"
            style:width="{WIDTH}px"
            onclick={activate(ws[ws.length - 1].id + 1)}
        >
            <div class="text-4xl mb-2">+</div>
            <div>新建工作区</div>
        </div>
    </div>
</div>

<style>
    /* 主题变量已迁移到 .contianer（不使用 :root）
       保持 --bg 不变。tiled 使用蓝色系，floating 使用金黄色系。 */

    .contianer {
        /* 局部主题变量（不使用 :root） */
        --panel-border: rgba(255, 255, 255, 0.05);
        --workspace-bg: rgba(255, 255, 255, 0.09);
        --workspace-hover: rgba(255, 255, 255, 0.18);
        /* tiled: 蓝色系 (非浮动窗口) - 使用单一纯色 */
        --tiled-color: rgba(118, 180, 255, 0.514);
        /* floating: 金黄色系 (浮动窗口) - 使用单一纯色 */
        --floating-color: rgba(252, 224, 123, 0.482);
        --accent: 80, 160, 255;

        background-color: var(--bg);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--panel-border);
        box-sizing: border-box;
        padding: 6px;
    }

    .workspace {
        background-color: var(--workspace-bg);
        transition:
            transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1),
            box-shadow 220ms ease,
            background-color 180ms ease;
        border: 1px solid rgba(255, 255, 255, 0.04);
        overflow: hidden;
        cursor: pointer;
    }

    .workspace:hover {
        /* 移除浮动/缩放，改为简单边框+背景高亮 */
        transform: none;
        box-shadow: none;
        background-color: var(--workspace-hover);
        outline: 1px solid rgba(var(--accent), 0.06);
    }

    .active {
        box-shadow:
            0 10px 36px rgba(0, 0, 0, 0.45),
            0 0 0 4px rgba(var(--accent), 0.06) inset;
        transform: none;
        outline: 1px solid rgba(var(--accent), 0.08);
    }

    /* client 动画与边框固定在 box-sizing 内 */
    .client {
        position: absolute;
        border: 1px solid rgba(255, 255, 255, 0.06);
        box-sizing: border-box;
        border-radius: 4px;
        transition:
            left 160ms cubic-bezier(0.2, 0.9, 0.2, 1),
            top 160ms cubic-bezier(0.2, 0.9, 0.2, 1),
            width 160ms cubic-bezier(0.2, 0.9, 0.2, 1),
            height 160ms cubic-bezier(0.2, 0.9, 0.2, 1),
            transform 160ms ease,
            background-color 160ms ease;
        will-change: left, top, width, height, transform;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        /* 非浮动窗口使用 tiled 纯色背景 */
        background-color: var(--tiled-color);
        color: #fff;
        backdrop-filter: blur(0px);
    }

    .client > div {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 6px;
    }

    /* 不使用 scale 以免改变绝对定位位置和破坏圆角；使用阴影、边框和亮度提升 */
    /* 不使用漂浮位移；在 client hover 时使用叠加层和轻微边框色变化 */
    .client:hover {
        border-color: rgba(255, 255, 255, 0.12);
    }

    .client-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.02));
        opacity: 0;
        transition: opacity 140ms ease;
        border-radius: 8px;
        mix-blend-mode: overlay;
    }

    .client:hover .client-overlay {
        opacity: 1;
    }

    /* 浮动窗口颜色和阴影更醒目，但仍保持扁平感 */
    .floating {
        background-color: var(--floating-color);
        border: 1px solid rgba(220, 150, 45, 0.12);
        transform-origin: center center;
    }

    /* 图标与文字样式微调 */
    .client img {
        width: 32px;
        height: 32px;
        object-fit: contain;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
    }

    .client span {
        font-size: 16px;
        margin-top: 6px;
        opacity: 0.95;
    }
</style>
