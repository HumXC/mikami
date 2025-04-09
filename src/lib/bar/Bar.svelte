<script lang="ts">
    import { Layer } from "@mikami/mikami";
    import Time from "./Time.svelte";
    import Workspace from "./Workspace.svelte";
    import Tray from "./Tray.svelte";
    Layer.Init(
        new Layer.Options({
            Height: 34,
            Anchor: Layer.Edge.Top | Layer.Edge.Left | Layer.Edge.Right,
            Layer: Layer.Layer.Top,
            Margin: [8, 8, 0, 8],
            AutoExclusiveZoneEnable: true,
        })
    ).then(Layer.Show);
</script>

<div class="container">
    <div class="left">
        <Tray />
        <Workspace />
    </div>

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
        background: #000308b1;
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
