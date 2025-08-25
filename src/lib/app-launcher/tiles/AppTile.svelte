<script lang="ts">
    import { onMount } from "svelte";
    import { apps, OnAppRun } from "../common";
    import { cellSize, type TileOption } from "./utils";
    import { apps as App } from "@mika-shell/core";
    import { FileQuestionIcon } from "lucide-svelte";
    const iconSizes = new Map<number, number>([
        [cellSize, cellSize * 0.65],
        [cellSize * 2, cellSize * 0.9],
        [cellSize * 3, cellSize * 1.5],
        [cellSize * 4, cellSize * 1.8],
    ]);

    let iconSize = iconSizes.get(cellSize)!;
    let textSize = cellSize * 0.3;
    export let option: TileOption;

    const app = apps.get(option.data);
    let showText = false;
    let tileEl: HTMLElement;
    function updateSize() {
        const rect = tileEl.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w === 0 || h === 0) return;
        requestAnimationFrame(() => {
            showText = Math.min(w, h) >= 2 * cellSize;
            for (const [size, sizePx] of iconSizes.entries()) {
                if (Math.min(w, h) <= size) {
                    iconSize = sizePx;
                    break;
                }
                iconSize = sizePx;
            }
        });
    }
    function RunApp() {
        if (!app) return;
        App.activate(app.id);
        OnAppRun(app);
    }
    onMount(() => {
        updateSize();

        const resizeObserver = new ResizeObserver(() => {
            updateSize();
        });

        resizeObserver.observe(tileEl);
        setTimeout(() => {
            isReady = true;
        }, 100);
        return () => resizeObserver.disconnect();
    });
    let isReady = false;
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    on:click={RunApp}
    bind:this={tileEl}
    data-app-entry-id={option.data}
    class="tile w-full h-full flex flex-col justify-center items-center rounded-lg"
>
    {#if app}
        <img
            class="p-0.5"
            src={app.iconData}
            style:width={iconSize + "px"}
            style:height={iconSize + "px"}
            class:duration-500={isReady}
        />
        {#if showText}
            <span
                class="truncate w-full p-2 text-center"
                class:duration-500={isReady}
                style:font-size={textSize + "px"}>{app.name}</span
            >
        {/if}
    {:else}
        <FileQuestionIcon size={iconSize} />
        <span class="truncate w-full p-2 text-center">{option.data}</span>
    {/if}
</div>

<style>
    .tile {
        background-color: var(--bg2);
    }
</style>
