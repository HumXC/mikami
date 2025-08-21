<script lang="ts">
    import { icon, layer, monitor } from "@mika-shell/core";
    import { hyprland } from "@mika-shell/extra";
    import hotkeys from "hotkeys-js";
    import { AppWindow } from "lucide-svelte";
    import { onMount } from "svelte";
    const padding = 8;
    const HIDDEN_WIDTH = 6;
    const WIDTH = 270;
    const LAYER_WIDTH = WIDTH + padding * 5 + 4;
    let SCALE = 1;
    let HEIGHT = 0;
    let timer: number = 0;
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
            const monitor_ = await monitor.get();
            SCALE = WIDTH / monitor_.width;
            HEIGHT = monitor_.height * SCALE;
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
            let x = client.at[0] * SCALE;
            let y = client.at[1] * SCALE;
            let w = client.size[0] * SCALE;
            let h = client.size[1] * SCALE;
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
            workspace.clients.push({
                x,
                y,
                w,
                h,
                floating: client.floating,
                className: client.class,
            });
        });
        ws = Array.from(map.values()).sort((a, b) => a.id - b.id);
    };
    onMount(async () => {
        window.addEventListener("mousemove", async () => {
            if (!isShow) {
                isShow = true;
                layer.setSize(LAYER_WIDTH, 0);
                update();
                layer.setKeyboardMode("exclusive");
            }
            clearTimeout(timer);
        });
        box.addEventListener("mouseleave", () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
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
                console.log(ws[(i + 1) % ws.length].id);

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
</script>

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
        {#each ws as workspace}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                class="workspace relative w-full flex-shrink-0 border-0 rounded-sm"
                style:height="{HEIGHT}px"
                style:width="{WIDTH}px"
                class:active={workspace.id === activeWorkspace}
                onclick={activate(workspace.id)}
            >
                {#each workspace.clients as client}
                    <div
                        class="client absolute border-1 rounded-sm"
                        class:floating={client.floating}
                        style:left="{client.x}px"
                        style:top="{client.y}px"
                        style:width="{client.w}px"
                        style:height="{client.h}px"
                    >
                        <div
                            class="w-full h-full flex flex-col justify-center items-center"
                            style:visibility={Math.min(client.w, client.h) > 30
                                ? "visible"
                                : "hidden"}
                        >
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
                                style:visibility={Math.min(client.w, client.h) > 30
                                    ? "visible"
                                    : "hidden"}
                                class="w-full text-center pl-2 pr-2 text-white text-2xs whitespace-nowrap overflow-hidden text-ellipsis"
                                >{client.className}</span
                            >
                        </div>
                    </div>
                {/each}
            </div>
        {/each}
    </div>
</div>

<style>
    .contianer {
        background-color: #3b3b3bb0;
        border: 2px solid #aeaeae88;
        box-sizing: border-box;
    }
    .workspace {
        background-color: rgba(63, 106, 215, 0.623);
        transition: background-color 0.2s ease-in-out;
    }
    .active,
    .workspace:hover {
        background-color: rgba(30, 145, 26, 0.728);
        box-shadow: 0px 0px 3px rgba(172, 255, 147, 0.81);
    }
    .client {
        background-color: rgba(191, 191, 191, 0.651);
    }
    .floating {
        background-color: rgba(193, 193, 193, 0.267);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.25);
    }
</style>
