<script lang="ts">
    import { layer, monitor } from "@mika-shell/core";
    import { hyprland } from "@mika-shell/extra";
    import { workspace } from "@mika-shell/extra/hyprland";
    import { clients } from "@mika-shell/extra/hyprland/command";
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
    layer
        .init({
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
        clients: { x: number; y: number; w: number; h: number; floating: boolean }[];
    };
    let ws: Workspace[] = [];
    const update = async () => {
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
            });
        });
        ws = Array.from(map.values()).sort((a, b) => a.id - b.id);
    };
    onMount(async () => {
        window.addEventListener("mousemove", async () => {
            clearTimeout(timer);
            layer.setSize(LAYER_WIDTH, 0);
            isShow = true;
            update();
        });
        box.addEventListener("mouseleave", () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                layer.setSize(HIDDEN_WIDTH, 0);
                isShow = false;
            }, 600);
        });
    });
    const activate = (id: number) => {
        return () => {
            hyprland.command.dispatch("workspace", id.toString());
        };
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
                    ></div>
                {/each}
            </div>
        {/each}
    </div>
</div>

<style>
    .contianer {
        background-color: #4b4b4b84;
        border: 2px solid #aeaeae88;
        box-sizing: border-box;
    }
    .workspace {
        background-color: rgba(63, 106, 215, 0.623);
    }
    .workspace:hover {
        background-color: rgba(30, 145, 26, 0.728);
    }
    .client {
        background-color: rgb(191, 191, 191);
        opacity: 0.8;
    }
    .floating {
        background-color: rgba(193, 193, 193, 0.809);
        opacity: 0.7;
    }
</style>
