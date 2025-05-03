<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script lang="ts">
    import { Hyprland } from "@mikami/mikami";
    import { Workspace } from "@mikami/mikami/hyprland";
    import { onMount } from "svelte";

    let workspaces: Workspace[] = [];

    let activeWorkspaceId = 0;
    const update = async () => {
        const ws = await Hyprland.GetWorkspace();
        const result: Workspace[] = [];
        for (let i = 1; i <= ws[ws.length - 1].id; i++) {
            const w = ws.find((w) => w.id === i);

            if (w) {
                result.push(w);
            } else {
                result.push(new Workspace({ id: i, windows: 0 }));
            }
        }
        activeWorkspaceId = (await Hyprland.GetActiveWorkspace()).id;
        workspaces = result;
    };
    onMount(update);
    Hyprland.Subscribe("workspace", update);

    function switchWorkspace(id: number) {
        activeWorkspaceId = id;
        Hyprland.Dispatch(`workspace ${id}`);
    }
</script>

<div class="continer flex items-center rounded-full px-2 w-fit">
    {#each workspaces as w (w.id)}
        <div
            class="relative flex items-center justify-center p-2 h-6"
            on:click={() => switchWorkspace(w.id)}
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
        background-color: rgba(182, 182, 182, 0.274);
    }
    .item {
        background-color: rgba(184, 182, 182, 0.622);
    }
    .empty {
        background-color: transparentd;
        border: 1px solid rgba(255, 255, 255, 0.441);
    }
    .active {
        background-color: rgb(241, 241, 241);
    }
</style>
