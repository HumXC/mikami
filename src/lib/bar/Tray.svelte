<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script lang="ts">
    import { mika, tray } from "@mika-shell/core";
    import { onMount } from "svelte";
    let items: tray.Item[] = [];
    onMount(async () => {
        items = await tray.getItems();
    });
    tray.on("added", async (service: string) => {
        items = [...items, await tray.getItem(service)];
    });
    tray.on("removed", (service: string) => {
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
    let menu: [string, number] | null = null;
    mika.on("close", (id) => {
        if (menu && id === menu[1]) {
            menu = null;
        }
    });
    async function openMenu(service: string, el: HTMLElement) {
        const rect = el.getBoundingClientRect();
        const x = Math.floor(rect.x + rect.width / 2);
        if (menu) {
            mika.close(menu[1]);
        }
        if (menu && menu[0] === service) {
            menu = null;
        } else {
            menu = [
                service,
                await mika.open(`/#/traymenu?service=${encodeURIComponent(service)}&x=${x}`),
            ];
        }
    }
</script>

{#if items.length !== 0}
    <div class="flex items-center rounded-full gap-1">
        {#each items as item}
            <div
                class="
                bg-[#9696966b]
                rounded-xl
                p-0.5
                flex items-center justify-center
                h-6 w-6
                transition-all duration-300 ease-out
                overflow-hidden
            "
                oncontextmenu={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openMenu(item.service, e.currentTarget);
                }}
                onclick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.button === 0) {
                        tray.activate(item.service, e.clientX, e.clientY);
                    }
                }}
            >
                <img
                    alt=""
                    src={tray.pickIcon(item, 256)}
                    class="
                    w-full
                    h-full
                    transition-all duration-300 ease-out
                    flex items-center justify-center
                "
                />
            </div>
        {/each}
    </div>
{/if}
