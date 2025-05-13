<script lang="ts">
    import type { TileOption } from "./utils";
    import AppTile from "./AppTile.svelte";
    import { Application } from "../common";

    export let tile: TileOption;
</script>

{#if tile.type === "app"}
    <AppTile app={tile.data as Application} />
{/if}
