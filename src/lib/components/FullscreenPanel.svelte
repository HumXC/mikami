<script lang="ts">
    import { layer } from "@mika-shell/core";
    import hotkeys from "hotkeys-js";
    import { onMount } from "svelte";
    type LayerConfig = layer.Options;

    export let layerConfig: Partial<LayerConfig> = {};

    const defaultConfig: Partial<LayerConfig> = {
        width: 400,
        anchor: ["top", "right", "left", "bottom"],
        keyboardMode: "ondemand",
        layer: "top",
        margin: [8, 8, 8, 8],
        backgroundTransparent: true,
    };

    const config = { ...defaultConfig, ...layerConfig };

    let mouseDownTarget: EventTarget | null = null;

    onMount(() => {
        // 初始化layer
        layer.init(config);

        // 绑定Escape快捷键关闭
        hotkeys("Escape", () => {
            layer.close();
        });

        return () => {
            // 清理快捷键
            hotkeys.unbind("Escape");
        };
    });

    function handleBackgroundMouseDown(e: MouseEvent) {
        // 记录鼠标按下的目标元素
        mouseDownTarget = e.target;
    }

    function handleBackgroundClick(e: MouseEvent) {
        // 只有点击背景本身（不是子元素）且 mousedown 和 click 都在同一元素上才关闭
        if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) {
            layer.close();
        }
        mouseDownTarget = null;
    }
</script>

<!-- 全屏背景容器 -->
<!-- svelte-ignore a11y_click_events_have_key_keys -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="fixed top-0 left-0 w-full h-full bg-black/0 pointer-events-auto"
    role="button"
    tabindex="-1"
    on:mousedown={handleBackgroundMouseDown}
    on:click={handleBackgroundClick}
>
    <slot />
</div>

<style>
    :global(.fullscreen-panel-content) {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
</style>
