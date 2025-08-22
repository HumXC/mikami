<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script lang="ts">
    import * as ws from "@mika-shell/extra/hyprland/workspace";
    import { onMount } from "svelte";
    let workspaces: ws.Workspace[] = [];
    const emptyWorkspace = (id: number) => {
        return {
            id,
            windows: 0,
            name: "empty",
            monitor: "NaN",
            monitorID: 0,
            hasfullscreen: false,
            lastwindow: "",
            lastwindowtitle: "",
            ispersistent: false,
        };
    };

    let activeWorkspaceId = 0;
    const update = async () => {
        const workspaces_ = await ws.list();
        workspaces_.sort((a, b) => a.id - b.id);
        const max = workspaces_[workspaces_.length - 1].id - 1;
        for (let i = 0; i < max; i++) {
            if (workspaces_[i].id !== i + 1) {
                workspaces_.splice(i, 0, emptyWorkspace(i + 1));
            }
        }
        workspaces = workspaces_;
        activeWorkspaceId = (await ws.active()).id;
    };
    onMount(async () => {
        update();
        ws.on("create", update);
        ws.on("destroy", update);
        ws.on("active", (data) => {
            activeWorkspaceId = data.workspaceId;
        });
    });
    const onWheel = (e: WheelEvent) => {
        ws.activate(e.deltaY > 0 ? "next" : "prev");
    };
</script>

<div class="continer flex items-center rounded-full px-2 w-fit" onwheel={onWheel}>
    {#each workspaces as w (w.id)}
        <div
            class="relative flex items-center justify-center p-2 h-6"
            onclick={() => ws.activate(w.id)}
        >
            <div
                class="
                    item
                    absolute transition-all duration-300 ease-out
                    h-2 rounded-full
                    flex items-center justify-center
                    overflow-hidden
                    "
                class:w-4={w.id === activeWorkspaceId}
                class:w-2={w.id !== activeWorkspaceId}
                class:empty={w.windows === 0}
                class:active={w.id === activeWorkspaceId}
            ></div>
        </div>
    {/each}
</div>

<style>
    .continer {
        background-color: rgba(133, 133, 133, 0.274);
    }
    .item {
        background-color: rgba(186, 186, 186, 0.663);
    }
    .empty {
        background-color: rgba(61, 61, 61, 0.725);
        border: 1px solid rgba(255, 255, 255, 0.441);
    }
    .active {
        background-color: rgb(222, 222, 222);
        border: none;
    }
</style>
