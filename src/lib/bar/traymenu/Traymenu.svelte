<script lang="ts">
    import { icon, layer, tray, window } from "@mika-shell/core";
    import { ArrowLeft, ArrowRight } from "lucide-svelte";
    import { onMount } from "svelte";
    import { getHashSearchParams } from "../../../utils";

    const parmas = getHashSearchParams();
    const service = parmas.get("service")!;
    const x = Number(parmas.get("x")!);
    const gap = 8;
    layer.init({
        namespace: "traymenu",
        layer: "overlay",
        backgroundTransparent: true,
        anchor: ["left", "top"],
        margin: [gap, -1, -1, -1],
    });
    tray.getMenu(service).then(async (m) => {
        tree = [...tree, m];
    });
    let tree: tray.MenuNode[] = [];
    let closeTimer: number | null = null;
    onMount(() => {
        const observer = new ResizeObserver(async () => {
            const { width, height } = container.getBoundingClientRect();
            const w = Math.max(200, Math.floor(width));
            const h = Math.max(20, Math.floor(height));
            layer.setSize(w, h);
            const offset = Math.max(0, x - w / 2) + gap;
            layer.setMargin("left", offset);
            if (closeTimer) {
                clearTimeout(closeTimer);
                closeTimer = null;
            }
            requestAnimationFrame(() => {
                if (w <= 200) {
                    container.style.width = "100%";
                } else {
                    container.style.width = "auto";
                }
            });
        });

        observer.observe(container);
        container.addEventListener("mouseleave", () => {
            if (closeTimer !== null) {
                clearTimeout(closeTimer);
            }
            closeTimer = setTimeout(() => {
                layer.close();
            }, 300);
        });
        container.addEventListener("mouseenter", () => {
            if (closeTimer !== null) {
                clearTimeout(closeTimer);
            }
        });
    });
    let container: HTMLDivElement = undefined as any;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_missing_attribute -->
<div bind:this={container} class="w-auto p-2 rounded-xl bg-[var(--bg)] inline-flex flex-col gap-2">
    {#if tree.length > 0}
        {#if tree.length > 1}
            <div
                class="flex items-center gap-1 mb-2 ml-1"
                onclick={() => {
                    container.style.width = "auto";
                    tree = [...tree.slice(0, tree.length - 1)];
                }}
            >
                <ArrowLeft size={20} />
                <span>
                    {tree[tree.length - 1].properties["label"]}
                </span>
            </div>
        {/if}
        {#each tree[tree.length - 1].children as node}
            {#if node.properties["type"] === "separator"}
                <hr class="border-t border-gray-400" />
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
                    class="item px-4 py-2 cursor-pointer rounded-xl flex items-center gap-1"
                >
                    {#if node.properties["toggleType"] === "radio"}
                        <div
                            class:radio={node.properties["toggleState"]}
                            class:radio-checked={node.properties["toggleState"] === "checked"}
                            class="flex-shrink-0"
                        ></div>
                    {/if}
                    {#if node.properties["iconName"]}
                        {#await icon.lookup(node.properties["iconName"], 256) then icon}
                            <img class="w-5 h-5" src={icon} />
                        {/await}
                    {/if}
                    <!-- 在此处添加 mr-4 是因为当文本超出时，父容器并不会被撑大，导致文本超出父容器 -->
                    <span class="text-nowrap mr-4 flex-shrink-0">{node.properties["label"]}</span>
                    {#if node.children.length > 0}
                        <ArrowRight class="ml-auto" size={20} />
                    {/if}
                </div>
            {/if}
        {/each}
    {/if}
</div>

<style>
    .item {
        background-color: var(--bg2);
    }
    .item:hover {
        background-color: var(--selected);
    }
    .radio {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 1px solid #ccc;
        background-color: #ffffff94;
    }
    .radio-checked {
        background-color: var(--bg3);
    }
</style>
