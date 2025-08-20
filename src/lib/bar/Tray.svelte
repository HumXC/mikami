<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script lang="ts">
    import { tray } from "@mika-shell/core";
    import { onMount } from "svelte";
    let items: tray.Item[] = [];
    onMount(async () => {
        items = await tray.getItems();
    });
    tray.on("added", async (service: string) => {
        items = [...items, await tray.getItem(service)];
    });
    tray.on("removed", (service: string) => {
        console.log("removed", service);

        items = items.filter((item) => item.service !== service);
    });
    tray.on("changed", async (service: string) => {
        for (let i = 0; i < items.length; i++) {
            if (items[i].service === service) {
                items[i] = await tray.getItem(service);
                break;
            }
        }
        items = [...items];
    });
</script>

{#if items.length !== 0}
    <div class="flex items-center rounded-full gap-1">
        {#each items as item}
            <div
                class="
                flex items-center justify-center
                h-6 w-6 p-0.5
                transition-all duration-300 ease-out
                overflow-hidden
            "
                on:click={() => tray.activate(item.service, 0, 0)}
            >
                <img
                    alt=""
                    src={tray.pickIcon(item, 256)}
                    class="
                    w-full
                    h-full
                    transition-all duration-300 ease-out
                    rounded-full
                    flex items-center justify-center
                    overflow-hidden
                "
                />
            </div>
        {/each}
    </div>
{/if}
