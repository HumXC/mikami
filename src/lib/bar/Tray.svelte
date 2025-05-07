<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script lang="ts">
    import { Tray } from "@humxc/mikami";

    let items: Tray.Item[] = [];
    Tray.Init().then(async () => {
        items = await Tray.Items();
        Tray.Subscribe((it) => () => {
            items = it;
            console.log(it);
        });
    });
</script>

{#if items.length !== 0}
    <div class="flex items-center rounded-full gap-1">
        {#each items as item (item.Id)}
            <div
                class="
                flex items-center justify-center
                h-6 w-6 p-0.5
                transition-all duration-300 ease-out
                overflow-hidden
            "
                on:click={() => item.Activate()}
            >
                <img
                    alt=""
                    src={`data:image/png;base64,${item.Icon.Base64}`}
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
