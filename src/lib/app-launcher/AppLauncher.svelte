<script lang="ts">
    import { Layer, Window } from "@humxc/mikami";
    import { Application, ListApps } from "./common";
    import ByCategory from "./ByCategory.svelte";
    let apps: Application[] = [];
    ListApps().then(async (result) => {
        apps = result;
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

<!-- svelte-ignore a11y_missing_attribute -->
<div class="w-full h-full">
    <!-- sidebar -->
    <div class="sidebar w-70 h-full">
        <ByCategory {apps} />
    </div>
    <!-- cards -->
    <div></div>
</div>

<style>
    .sidebar {
        background-color: rgb(8, 14, 24);
        color: rgb(198, 198, 198);
    }
</style>
