<script lang="ts">
    import { layer, monitor } from "@mika-shell/core";
    import { shellData, type Payload } from "./helper";
    import Fuse from "fuse.js";
    import hotkeys from "hotkeys-js";
    import { SearchIcon, TerminalSquareIcon, FileQuestionIcon } from "lucide-svelte";
    import { onMount, tick } from "svelte";
    import { ensureVisible, KeyController, passControlKey } from "../../utils";
    let container: HTMLDivElement;
    layer
        .init({
            layer: "top",
            width: 600,
            anchor: ["top"],
            backgroundTransparent: true,
            keyboardMode: "ondemand",
            // keyboardMode: "exclusive",
        })
        .then(async () => {
            const m = await monitor.get();
            layer.setMargin("top", Math.floor(m.height / 3));
        });
    onMount(() => {
        const observer = new ResizeObserver(async () => {
            const { width, height } = container.getBoundingClientRect();
            const h = Math.min(300, Math.floor(height));
            layer.setSize(600, h);
            requestAnimationFrame(() => {
                if (h === 300) {
                    container.style.height = "100%";
                } else {
                    container.style.height = "auto";
                }
            });
        });

        observer.observe(container);
        document.addEventListener("keydown", (e) => {
            input.focus();
        });
    });
    hotkeys("f12", (e) => {
        e.stopPropagation();
        layer.openDevTools();
    });
    const fuse = new Fuse(shellData, {
        keys: ["name"],
        includeScore: true,
        threshold: 0.4,
    });
    function onInput(e: Event) {
        const input = (e.target as HTMLInputElement).value;
        const result = fuse.search(input);
        payload = result.map((r) => r.item);
        selected = 0;
        container.style.height = "auto";
    }
    let payload: Payload[] = [];
    const icons: any = {
        "shell-alias": TerminalSquareIcon,
        "shell-function": TerminalSquareIcon,
    };
    let selected: number = 0;
    hotkeys("tab,down,right", (e) => {
        e.stopPropagation();
        e.preventDefault();
        keyControl.control();
        selected = Math.min(selected + 1, payload.length - 1);
        ensureVisible(resultRef, document.querySelector(`[data-index="${selected}"]`)!);
    });
    hotkeys("shift+tab,up,left", (e) => {
        e.stopPropagation();
        e.preventDefault();
        keyControl.control();
        selected = Math.max(selected - 1, 0);
        ensureVisible(resultRef, document.querySelector(`[data-index="${selected}"]`)!);
    });
    let resultRef: HTMLDivElement;
    let input: HTMLInputElement;
    const keyControl = new KeyController();
</script>

<!-- svelte-ignore a11y_autofocus -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={container} class=" bg-[var(--bg)] w-full rounded-2xl p-2 flex flex-col gap-2">
    <div class=" bg-[var(--bg2)] rounded-2xl flex items-center pl-2 pr-2">
        <SearchIcon />
        <input
            bind:this={input}
            autofocus
            oninput={onInput}
            use:passControlKey
            class="w-full p-2"
        />
    </div>
    <div
        bind:this={resultRef}
        style:display={payload.length > 0 ? "flex" : "none"}
        class="w-full h-full overflow-y-auto flex flex-col gap-2"
    >
        {#each payload as item, i}
            <div
                data-index={i}
                class:selected={selected === i}
                onmousemove={() => {
                    if (keyControl.isInControl()) return;
                    selected = i;
                }}
                class="bg-[var(--bg2)] w-full flex justify-between items-center pt-2 pb-2 pl-3 pr-3 rounded-2xl"
            >
                <svelte:component
                    this={icons[item.type] || FileQuestionIcon}
                    size={32}
                    strokeWidth={1}
                    class="p-1 bg-[var(--bg3)] rounded-sm"
                />
                <span class="text-bold ml-1 mr-1">:</span>
                <span class="flex-grow">{item.name}</span>
                <span class="text-xs text-gray-400">{item.type}</span>
            </div>
        {/each}
    </div>
</div>

<style>
    .selected {
        background-color: var(--selected);
    }
</style>
