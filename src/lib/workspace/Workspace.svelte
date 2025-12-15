<script lang="ts">
    import { icon, layer, monitor } from "@mika-shell/core";
    import { hyprland } from "@mika-shell/extra";
    import hotkeys from "hotkeys-js";
    import { AppWindow } from "lucide-svelte";
    import { getHashSearchParams } from "../../utils";
    import { onMount } from "svelte";
    import FullscreenPanel from "../components/FullscreenPanel.svelte";
    const WIDTH = 270;
    let SCALE = 1;
    let HEIGHT = 0;
    const PADDING = 16;
    let activeWorkspace: number;
    const params = getHashSearchParams();
    let useKeyboard = params.get("keyboard") === "true";
    let side = params.get("side");
    let width: string = "auto";
    let height: string = "auto";
    const layerConfig: Partial<layer.Options> = {
        keyboardMode: useKeyboard ? "exclusive" : "ondemand",
    };
    switch (side) {
        case "left":
        case "right":
            height = "100vh";
            break;
        case "top":
        case "bottom":
            width = "100vw";
            break;
    }

    layer.on("show", async () => {
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
    function nextWorkspace() {
        for (let i = 0; i < ws.length; i++) {
            if (ws[i].id === activeWorkspace) {
                activate(ws[(i + 1) % ws.length].id)();
                break;
            }
        }
    }
    // Esc 关闭
    hotkeys("esc", (e) => {
        e.preventDefault();
        layer.close();
    });
    hotkeys("tab", (e) => {
        e.preventDefault();
        nextWorkspace();
    });
    // 在组件挂载时注册按键事件（仅当 useKeyboard 为 true）
    onMount(() => {
        update();
        if (!useKeyboard) return;
        // Tab 轮换工作区（按一次切一次）
        hotkeys("alt+tab", (e) => {
            e.preventDefault();
            nextWorkspace();
        });
        // Alt 释放时关闭
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Alt") {
                layer.close();
            }
        };
        window.addEventListener("keyup", onKeyUp);
    });
    const activate = (id: number) => {
        return () => {
            hyprland.command.dispatch("workspace", id.toString());
            activeWorkspace = id;
        };
    };
    const desktopEntrys = JSON.parse(localStorage.getItem("app-launcher-apps") || "[]");

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
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<FullscreenPanel {layerConfig} anchor={[side as any]} onClick={layer.close}>
    <div
        class="contianer flex items-center gap-4 overflow-auto rounded-xl"
        class:flex-col={side === "left" || side === "right"}
        class:flex-row={side === "top" || side === "bottom"}
        style:padding="{PADDING}px"
        style:width
        style:height
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
                        {#if client.w > 32}
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
                                {#if client.w > 64}
                                    <span
                                        class="w-full text-center pl-2 pr-2 text-white whitespace-nowrap overflow-hidden text-ellipsis"
                                        >{client.className}</span
                                    >
                                {/if}
                            </div>
                        {/if}

                        <!-- overlay for hover highlight / quick affordance (no floating) -->
                        <div class="client-overlay" aria-hidden="true"></div>
                    </div>
                {/each}
                <span
                    class=" absolute bottom-0 left-0 text-xl font-bold p-2 workspace-id"
                    class:active-id={workspace.id === activeWorkspace}>{workspace.id}</span
                >
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
</FullscreenPanel>

<style>
    .contianer {
        /* 局部主题变量 */
        --panel-border: rgba(255, 255, 255, 0.05);
        --workspace-bg: rgba(255, 255, 255, 0.09);
        --workspace-hover: rgba(255, 255, 255, 0.18);
        /* tiled: 蓝色系 (非浮动窗口) - 使用单一纯色 */
        --tiled-color: rgba(118, 180, 255, 0.514);
        /* floating: 金黄色系 (浮动窗口) - 使用单一纯色 */
        --floating-color: rgba(252, 224, 123, 0.482);
        --accent: 80, 160, 255;
        --active-green: 67, 197, 114;

        background-color: var(--bg);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--panel-border);
        box-sizing: border-box;
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
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.4);
        transform: none;
        outline: none;
        background-color: rgba(255, 255, 255, 0.1);
    }

    /* 激活工作区外部发光描边 */
    .workspace.active::before {
        content: "";
        position: absolute;
        pointer-events: none;
        inset: -6px;
        border-radius: 12px;
        border: 1px solid rgba(var(--active-green), 0.4);
        box-shadow:
            0 0 14px 6px rgba(var(--active-green), 0.55),
            0 0 2px 1px rgba(var(--active-green), 0.5);
        filter: blur(0.3px);
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

    /* 工作区编号尺寸与激活态放大 */
    .workspace-id {
        transition:
            transform 140ms ease,
            color 140ms ease,
            text-shadow 140ms ease;
    }

    .workspace-id.active-id {
        transform: scale(1.28);
        color: rgba(var(--active-green), 0.95);
        text-shadow: 0 0 10px rgba(var(--active-green), 0.6);
    }
</style>
