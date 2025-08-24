<script lang="ts">
    import type { Component } from "svelte";
    import { slide } from "svelte/transition";
    export let text = "";
    export let isExpanded = false;
    export let onClick: () => void = () => {};
    export let Icon: Component;
</script>

<button on:click={() => onClick()}>
    <div class="icon">
        <svelte:component this={Icon} class="w-full h-full" />
    </div>
    {#if isExpanded}
        <span class="text" transition:slide={{ duration: 200, axis: "x" }}>{text}</span>
    {/if}
</button>

<style>
    button {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        background-color: var(--bg2);
        border-radius: 0.375rem;
        padding: 0.2rem;
        transition: background-color 0.1s ease-in-out;
    }
    button:hover {
        background-color: var(--selected);
    }
    .text {
        font-size: 0.9rem;
        overflow: hidden;
        white-space: nowrap;
        flex: 1;
        text-align: left;
        padding-left: 8px;
        padding-right: 8px;
    }
    .icon {
        width: 1.6rem;
        height: 1.6rem;
        padding: 2px;
    }
</style>
