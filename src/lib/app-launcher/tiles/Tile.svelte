<script lang="ts">
    import type { TileOption } from "./utils";
    import AppTile from "./AppTile.svelte";
    import { Apps } from "../common";
    export let tile: TileOption;
</script>

<!-- Tile 的实现应当包含 tile class -->
{#if tile.type === "app"}
    <AppTile app={Apps.get(tile.data as string)!} />
{/if}
