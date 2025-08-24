<script lang="ts">
    import type { TileOption } from "./utils";
    import AppTile from "./AppTile.svelte";
    export let tile: TileOption;
</script>

<!-- Tile 的实现的 classList 中应当包含 "tile" 类 -->
{#if tile.type === "app"}
    <AppTile option={tile} />
{/if}
