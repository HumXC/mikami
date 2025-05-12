<script lang="ts">
    import { ChevronDown } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import { MouseHasMoved, OnRun, type Application } from "./common";
    export let onFocus: (app: Application) => void = () => {};
    export let onBlur: (app: Application) => void = () => {};
    export const getFocus = () => buttonRef?.focus();
    export const hasFocus = () => buttonRef?.contains(document.activeElement);
    export let app: Application;
    const RunApp = (app: Application, action?: string) => {
        app.Run(action);
        OnRun(app, action);
    };
    let showActions = false;
    let showPoint = false;
    let buttonRef: HTMLButtonElement;
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="app flex flex-col rounded-sm p-1">
    <div
        class="flex items-center justify-between rounded-sm"
        on:mousemove={(e) => {
            if (MouseHasMoved(e.x, e.y)) buttonRef?.focus();
        }}
        on:mouseleave={() => buttonRef?.blur()}
    >
        <button
            class="flex items-center w-full h-full"
            on:click={() => RunApp(app)}
            on:focus={() => {
                onFocus(app);
                showPoint = true;
            }}
            on:blur={() => {
                onBlur(app);
                showPoint = false;
            }}
            bind:this={buttonRef}
        >
            {#if showPoint}
                <div class="h-full flex items-center" in:slide={{ duration: 50, axis: "x" }}>
                    <div
                        class="h-full bg-gray-400/80 rounded-full overflow-hidden"
                        in:slide={{ duration: 250 }}
                        out:slide={{ duration: 250, axis: "x" }}
                        style:width={showPoint ? "4px" : "0px"}
                        style:transition="width 0.05s ease-in-out"
                    ></div>
                </div>
            {/if}
            <img class="w-10 h-10 p-1" src={app.IconData} />
            <span class="text-sm text-no-overflow">{app.Name}</span>
        </button>
        {#if app.Actions.length > 0}
            <button
                tabindex="-1"
                class="expend-button p-1 mr-1 rounded-sm"
                on:click={() => (showActions = !showActions)}
            >
                <div
                    class=" transition-transform duration-300 ease-in-out origin-center"
                    class:rotate-180={showActions}
                >
                    <ChevronDown class="w-4 h-4" />
                </div>
            </button>
        {/if}
    </div>

    <!-- Actions -->
    {#if app.Actions.length > 0 && showActions}
        <div transition:slide={{ duration: 250 }} class="overflow-hidden text-center">
            <hr class="w-[90%] mx-auto m-1" />
            <div class="flex flex-col gap-1">
                {#each app.Actions as action}
                    <div class="action h-10 rounded-sm">
                        <button
                            class="w-full h-full pl-2 flex items-center
                            text-left text-sm text-no-overflow
                            rounded-sm"
                        >
                            {action!.Name}
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .app {
        background-color: rgba(44, 51, 63, 0.705);
    }
    .text-no-overflow {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .expend-button {
        background-color: rgba(255, 255, 255, 0.118);
    }
    .action {
        transition: background-color 0.1s ease-in-out;
    }
    .action:hover {
        background-color: rgba(255, 255, 255, 0.118);
    }
</style>
