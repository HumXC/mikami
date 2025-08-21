<script lang="ts">
    import Time from "./Time.svelte";
    import Tray from "./Tray.svelte";
    import { layer } from "@mika-shell/core";
    import Workspace from "./Workspace.svelte";
    import Recording from "./indicator/Recording.svelte";
    layer.init({
        height: 34,
        anchor: ["top", "right", "left"],
        layer: "top",
        margin: [8, 8, 0, 8],
        autoExclusiveZone: true,
        backgroundTransparent: true,
    });
</script>

<div class="container">
    <div class="left"><Tray /><Workspace /></div>

    <div class="center">
        <div class="center-left"></div>
        <div class="center-center"><Time /></div>
        <div class="center-right"><Recording /></div>
    </div>

    <div class="right"></div>
</div>

<style>
    .container {
        @apply flex flex-row justify-between items-center min-w-full min-h-full;
        padding: 0 6px;
        border-radius: 50px;
        background: #000308a8;
    }

    .left,
    .right {
        @apply flex flex-1 items-center;
        gap: 8px;
    }

    .left {
        justify-content: flex-start;
    }

    .right {
        justify-content: flex-end;
    }

    .center {
        display: grid;
        grid-template-columns: 1fr auto 1fr; /* 左中右三列 */
        align-items: center;
        gap: 0.5rem; /* 可选，左右间距 */
    }

    .center-center {
        text-align: center;
        justify-self: center;
        white-space: nowrap;
    }
    .center-left {
        justify-self: end;
        min-width: 0;
        text-align: right;
    }

    .center-right {
        justify-self: start;
        min-width: 0;
        text-align: right;
    }
</style>
