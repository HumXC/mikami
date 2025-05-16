<script lang="ts">
    import { onMount } from "svelte";
    import { OnAppRun, type Application } from "../common";
    import { cellSize } from "./utils";
    const iconSizes = new Map<number, number>([
        [cellSize, cellSize * 0.65],
        [cellSize * 2, cellSize * 0.9],
        [cellSize * 3, cellSize * 1.5],
    ]);

    let iconSize = iconSizes.get(cellSize)!;

    export let app: Application;
    let showText = true;
    let tileEl: HTMLElement;
    function updateSize() {
        const rect = tileEl.getBoundingClientRect();
        showText = Math.min(rect.width, rect.height) >= cellSize;
        for (const [size, sizePx] of iconSizes.entries()) {
            if (Math.min(rect.width, rect.height) <= size) {
                iconSize = sizePx;
                break;
            }
            iconSize = sizePx;
        }
    }
    function RunApp() {
        if (!app) return;
        app.Run();
        OnAppRun(app);
    }
    onMount(() => {
        updateSize();

        const resizeObserver = new ResizeObserver(() => {
            updateSize();
        });

        resizeObserver.observe(tileEl);

        return () => resizeObserver.disconnect();
    });
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    on:click={RunApp}
    bind:this={tileEl}
    data-app-entry-path={app.EntryPath}
    class="tile bg-blur w-full h-full flex flex-col justify-center items-center rounded-lg"
>
    <img
        class="p-0.5"
        src={app.IconData}
        style:width={iconSize + "px"}
        style:height={iconSize + "px"}
    />
    {#if showText}
        <span class="truncate w-full p-2 text-center">{app.Name}</span>
    {/if}
</div>

<style>
    * {
        transition: all 0.3s ease-in-out;
    }
    .tile {
        background-color: #202a38b5;
    }
    .bg-blur {
        backdrop-filter: blur(64px);
    }
</style>
