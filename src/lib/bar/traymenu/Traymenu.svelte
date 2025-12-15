<script lang="ts">
    import { icon, layer, tray } from "@mika-shell/core";
    import { ArrowLeft, ArrowRight } from "lucide-svelte";
    import { onMount } from "svelte";
    import { getHashSearchParams } from "../../../utils";
    import FullscreenPanel from "../../components/FullscreenPanel.svelte";

    const parmas = getHashSearchParams();
    const service = parmas.get("service")!;
    const x = Number(parmas.get("x")!);
    const y = Number(parmas.get("y")!);
    const side: "left" | "right" | "top" | "bottom" = parmas.get("side")! as any;

    tray.getMenu(service).then(async (m) => {
        tree = [...tree, m];
    });
    let tree: tray.MenuNode[] = [];
    // 初始放到屏幕外以便测量尺寸，避免首帧跳动
    let containerStyle = "visibility:hidden; pointer-events:none; top:-10000px; left:-10000px;";

    onMount(async () => {
        const updatePosition = () => {
            const { width, height } = container.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            console.log(screenWidth, screenHeight, width, height);

            let styles: string[] = [];

            switch (side) {
                case "top": {
                    // 顶部贴边，水平居中到 x：直接计算 left，避免 translate 带来的重排
                    const half = Math.floor(width / 2);
                    let leftPx = x - half;
                    if (leftPx < 0) leftPx = 0;
                    if (leftPx + width > screenWidth) leftPx = screenWidth - width;
                    styles.push(`top: 0`);
                    styles.push(`left: ${leftPx}px`);
                    break;
                }
                case "bottom": {
                    const half = Math.floor(width / 2);
                    let leftPx = x - half;
                    if (leftPx < 0) leftPx = 0;
                    if (leftPx + width > screenWidth) leftPx = screenWidth - width;
                    styles.push(`bottom: 0`);
                    styles.push(`left: ${leftPx}px`);
                    break;
                }
                case "left": {
                    const half = Math.floor(height / 2);
                    let topPx = y - half;
                    if (topPx < 0) topPx = 0;
                    if (topPx + height > screenHeight) topPx = screenHeight - height;
                    styles.push(`left: 0`);
                    styles.push(`top: ${topPx}px`);
                    break;
                }
                case "right": {
                    const half = Math.floor(height / 2);
                    let topPx = y - half;
                    if (topPx < 0) topPx = 0;
                    if (topPx + height > screenHeight) topPx = screenHeight - height;
                    styles.push(`right: 0`);
                    styles.push(`top: ${topPx}px`);
                    break;
                }
            }

            // 首次定位后再显示，避免因尺寸为 0 导致的跳动
            styles.push("opacity:1");
            styles.push("visibility:visible");
            styles.push("pointer-events:auto");
            containerStyle = styles.join("; ");
        };

        const observer = new ResizeObserver(updatePosition);
        observer.observe(container);
    });

    let container: HTMLDivElement = undefined as any;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_missing_attribute -->
<FullscreenPanel onEscape={layer.close} onClick={layer.close} fixed={true}>
    <div
        bind:this={container}
        style={containerStyle}
        class="menu-container absolute min-w-60 max-w-sm p-1.5 rounded-2xl bg-[var(--bg)] shadow-2xl backdrop-blur-xl inline-flex flex-col gap-0.5"
    >
        {#if tree.length > 0}
            {#if tree.length > 1}
                <div
                    class="back-button flex items-center gap-2 px-3 py-2 mb-1 cursor-pointer rounded-xl transition-all duration-150"
                    onclick={() => {
                        container.style.width = "auto";
                        tree = [...tree.slice(0, tree.length - 1)];
                    }}
                >
                    <ArrowLeft size={18} class="flex-shrink-0" />
                    <span class="text-sm font-medium truncate">
                        {tree[tree.length - 1].properties["label"]}
                    </span>
                </div>
            {/if}
            {#each tree[tree.length - 1].children as node}
                {#if node.properties["type"] === "separator"}
                    <div class="separator my-1 mx-2 border-t border-gray-300/30"></div>
                {:else}
                    <div
                        onclick={() => {
                            if (node.children.length > 0) {
                                container.style.width = "auto";
                                tree = [...tree, node];
                            } else {
                                tray.activateMenu(service, node.id);
                                layer.close();
                            }
                        }}
                        class="menu-item px-3 py-2.5 cursor-pointer rounded-xl flex items-center gap-2.5 transition-all duration-150 active:scale-[0.98]"
                        class:disabled={node.properties["enabled"] === false}
                    >
                        {#if node.properties["toggleType"] === "checkmark"}
                            <div
                                class="checkmark flex-shrink-0 w-4 h-4 flex items-center justify-center"
                            >
                                {#if node.properties["toggleState"] === "checked"}
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                {/if}
                            </div>
                        {:else if node.properties["toggleType"] === "radio"}
                            <div
                                class="radio flex-shrink-0"
                                class:radio-checked={node.properties["toggleState"] === "checked"}
                            ></div>
                        {:else if node.properties["iconName"]}
                            {#await icon.lookup(node.properties["iconName"], 256) then iconSrc}
                                <img
                                    class="w-5 h-5 flex-shrink-0 object-contain"
                                    src={iconSrc}
                                    alt=""
                                />
                            {/await}
                        {/if}

                        <span class="text-sm flex-1 truncate select-none"
                            >{node.properties["label"]}</span
                        >

                        {#if node.children.length > 0}
                            <ArrowRight class="ml-auto flex-shrink-0 opacity-60" size={16} />
                        {/if}
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</FullscreenPanel>

<style>
    .menu-container {
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: menuAppear 0.15s ease-out;
    }

    @keyframes menuAppear {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .back-button {
        background-color: rgba(255, 255, 255, 0.05);
        color: var(--fg);
    }

    .back-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .menu-item {
        background-color: transparent;
        color: var(--fg);
        position: relative;
    }

    .menu-item:hover {
        background-color: var(--selected);
    }

    .menu-item:active {
        background-color: var(--selected);
        filter: brightness(0.95);
    }

    .menu-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }

    .separator {
        height: 0;
    }

    .radio {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid currentColor;
        background-color: transparent;
        opacity: 0.6;
        transition: all 0.15s ease;
    }

    .radio-checked {
        opacity: 1;
        background-color: currentColor;
        box-shadow: inset 0 0 0 3px var(--bg);
    }

    .checkmark {
        color: var(--fg);
    }
</style>
