<script lang="ts">
    import { Layer, Window } from "@humxc/mikami";
    import { Application, ListApps } from "./common";
    import ByCategory from "./ByCategory.svelte";
    import { convertToPinyin } from "tiny-pinyin";
    import SideControler from "./SideControler.svelte";
    import { slide } from "svelte/transition";
    let apps: Application[] = [];
    let appsByCategory: Map<string, Application[]> = new Map();
    let appsByName: Map<string, Application[]> = new Map();
    let browserState: string = "hide";
    ListApps().then(async (result) => {
        apps = result;
        appsByName = apps.reduce((acc, app) => {
            const name = app.Name || "";
            const firstChar = name[0] || "";
            const py = convertToPinyin(firstChar);
            let letter = py?.[0]?.[0]?.toUpperCase?.() || "#";
            if (!/^[A-Z]$/.test(letter)) {
                letter = "#";
            }
            if (!acc.has(letter)) {
                acc.set(letter, []);
            }
            acc.get(letter)!.push(app);
            return acc;
        }, appsByName);
        appsByName = appsByName;
        appsByCategory = apps.reduce((acc, app) => {
            const category = app.Categories || ["Others"];
            for (const cat of category) {
                if (!acc.has(cat)) {
                    acc.set(cat, []);
                }
                acc.get(cat)!.push(app);
            }
            return acc;
        }, appsByCategory);
        appsByCategory = appsByCategory;
    });
    // Layer.Init({
    //     Height: 100,
    //     Anchor: ["top", "right", "left"],
    //     Layer: "top",
    //     Margin: [8, 8, 0, 8],
    //     AutoExclusiveZoneEnable: true,
    //     KeyboardMode: "on-demand",
    // });
    Window.Init();

    document.addEventListener("keydown", (e) => {
        if (e.code === "Escape") Layer.Close();
    });
</script>

<div class="w-full h-full flex">
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

    <!-- cards -->
    <div></div>
</div>

<style>
    .browser {
        background-color: rgb(8, 14, 24);
        color: rgb(198, 198, 198);
    }
</style>
