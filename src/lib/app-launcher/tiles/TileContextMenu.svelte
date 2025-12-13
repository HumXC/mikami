<script lang="ts">
    import { Trash2 } from "lucide-svelte";
    import { contextMenuStore, hideContextMenu } from "./contextMenuStore";

    let contextMenu: HTMLElement;

    function handleClickOutside(e: MouseEvent) {
        if (contextMenu && !contextMenu.contains(e.target as Node)) {
            hideContextMenu();
        }
    }

    function handleContextMenu(e: MouseEvent) {
        e.preventDefault();
        hideContextMenu();
    }
</script>

<svelte:window on:click={handleClickOutside} on:contextmenu={handleContextMenu} />

{#if $contextMenuStore.visible}
    <div
        bind:this={contextMenu}
        class="context-menu"
        style:left={$contextMenuStore.x + 8 + "px"}
        style:top={$contextMenuStore.y + 8 + "px"}
    >
        <slot />
    </div>
{/if}

<style>
    .context-menu {
        position: fixed;
        z-index: 9999;
        min-width: 200px;
        background: rgba(44, 44, 44, 0.95);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 4px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        animation: menuFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes menuFadeIn {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
</style>
