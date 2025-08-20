<script lang="ts">
    import Time from "./Time.svelte";
    import Tray from "./Tray.svelte";
    import { layer, notifd, mika } from "@mika-shell/core";
    import Workspace from "./Workspace.svelte";
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
        <div class="center-left">L</div>
        <div class="center-center"><Time /></div>
        <div class="center-right">R</div>
    </div>

    <div class="right">右</div>
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
        position: relative;
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
    }

    .center-left,
    .center-right {
        flex: 1;
    }

    .center-left {
        text-align: right;
        margin-right: 0.5rem;
    }

    .center-center {
        flex-shrink: 0;
        text-align: center;
    }

    .center-right {
        text-align: left;
        margin-left: 0.5rem;
    }
</style>
