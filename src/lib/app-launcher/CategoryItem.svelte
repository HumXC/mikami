<script lang="ts">
    import { ChevronDown } from "lucide-svelte";
    import AppItem from "./AppItem.svelte";
    import { slide } from "svelte/transition";
    import type { Application } from "./common";
    import { Sleep } from "../../utils";
    export const unexpand = () => (expand_ = false);
    export const expand = () => (expand_ = true);
    export const getCategory = () => category;
    export let category: string;
    export let apps: Application[];
    export let onRun: (app: Application, action?: string) => void = () => {};
    let expand_ = false;
    let appsRef: AppItem[] = [];
    let hasFocus = false;

    let focusFirstApp = false;
    function handleKeyPressed(event: KeyboardEvent) {
        if (event.key === "Enter") {
            expand_ = !expand_;
            focusFirstApp = true;
        }
    }
</script>

<div class="category flex flex-col rounded-sm">
    <button
        class="
        category-{category}
        rounded-sm p-1
        flex items-center justify-between
        "
        on:keypress={handleKeyPressed}
        on:mouseup={() => (expand_ = !expand_)}
    >
        <span class="category-name text-left text-nowrap text-ellipsis overflow-hidden"
            >{category}</span
        >
        <div
            class="mt-1 transition-transform duration-300 ease-in-out origin-center"
            class:rotate-180={expand_}
        >
            <ChevronDown class="w-4 h-4" />
        </div>
    </button>
    {#if expand_}
        <div
            on:introend={async () => {
                await Sleep(0);
                focusFirstApp && appsRef[0]?.getFocus();
                focusFirstApp = false;
            }}
            transition:slide={{ duration: 250 }}
            class="flex flex-col gap-1 ml-1 p-1"
        >
            {#each apps as app, i}
                <AppItem
                    bind:this={appsRef[i]}
                    {app}
                    {onRun}
                    onFocus={() => (hasFocus = true)}
                    onBlur={() => (hasFocus = false)}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    .category {
        transition:
            background-color 0.1s ease-in-out,
            padding-left 0.1s ease-in-out;
    }
    .category:hover {
        /* FIXME: 这个配色感觉有点丑 */
        background-color: rgba(93, 227, 113, 0.511);
        padding-left: 6px;
    }
</style>
