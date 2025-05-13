<script lang="ts">
    import { onMount } from "svelte";
    import type { Application } from "../common";
    const iconSizes = new Map<number, number>([
        [100, 45],
        [200, 80],
        [300, 120],
    ]);

    let iconSize = iconSizes.get(100)!;

    export let app: Application;
    let showText = true;
    let tileEl: HTMLDivElement;
    function updateSize() {
        const rect = tileEl.getBoundingClientRect();
        showText = rect.width >= 100 && rect.height >= 100;
        for (const [size, sizePx] of iconSizes.entries()) {
            if (Math.min(rect.width, rect.height) <= size) {
                iconSize = sizePx;
                break;
            }
            iconSize = sizePx;
        }
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
<div
    bind:this={tileEl}
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
