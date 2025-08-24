<script lang="ts">
    import { layer, window } from "@mika-shell/core";
    import { appsByCategory, appsByName } from "./common";
    import ByCategory from "./category/ByCategory.svelte";
    import SideControler from "./sidebar/SideControler.svelte";
    import { slide } from "svelte/transition";
    import Tiles from "./tiles/Tiles.svelte";
    let browserState: string = localStorage.getItem("app-launcher-browser-state") || "name";
    $: localStorage.setItem("app-launcher-browser-state", browserState);
    layer.init({
        anchor: ["top", "right", "left", "bottom"],
        layer: "top",
        exclusiveZone: -1,
        keyboardMode: "exclusive",
        backgroundTransparent: true,
    });
    document.addEventListener("keydown", (e) => {
        if (e.code === "Escape") layer.close();
        if (e.code == "Tab") {
            if (browserState === "hide") {
                browserState = "name";
            }
        }
    });
</script>

<div class="w-full h-full flex">
    <!-- side -->
    <div class="h-full">
        <SideControler bind:state={browserState} />
    </div>

    <!-- browser -->
    {#if browserState !== "hide"}
        <div class="browser w-60 h-full" transition:slide={{ duration: 120, axis: "x" }}>
            {#if browserState === "name"}
                <ByCategory apps={appsByName} />
            {:else if browserState === "tags"}
                <ByCategory apps={appsByCategory} />
            {/if}
        </div>
    {/if}

    <!-- tiles -->
    <div class="tiles flex-1">
        <Tiles />
    </div>
</div>

<style>
    .browser {
        background-color: var(--bg);
        color: rgb(198, 198, 198);
    }
    .tiles {
        background-color: var(--bg);
    }
</style>
