<script lang="ts">
    import { layer, monitor, os } from "@mika-shell/core";
    import { tick } from "svelte";
    import hotkeys from "hotkeys-js";
    import Mask from "./Mask.svelte";
    import Selector from "./Selector.svelte";
    let mask: Mask;
    let selector: Selector;
    let selection: Rectangle;
    type Rectangle = { x: number; y: number; w: number; h: number };
    layer.init({
        keyboardMode: "exclusive",
        namespace: "screenshot",
        anchor: ["bottom", "left", "right", "top"],
        layer: "top",
        autoExclusiveZone: false,
        backgroundTransparent: true,
        exclusiveZone: -1,
    });

    hotkeys("esc", (e) => {
        e.stopPropagation();
        layer.close();
    });

    hotkeys("ctrl+a", (e) => {
        e.stopPropagation();
        if (e.ctrlKey && e.key === "a") {
            selection.x = 0;
            selection.y = 0;
            selection.w = globalThis.window.innerWidth;
            selection.h = globalThis.window.innerHeight;
        }
        // screenshot();
    });
    hotkeys("f12", (e) => {
        e.stopPropagation();
        layer.openDevTools();
    });

    async function screenshot() {
        if (!hasSelection) return;
        // 避免选框出现在截图中
        selector.visible = false;
        await tick();
        await tick();
        await tick();
        const cropped = await mask.crop(selection);
        const base64 = cropped.toDataURL("image/png", 1).replace("data:image/png;base64,", "");
        await os.write("/tmp/screenshot.png", base64);
        os.exec(["sh", "-c", "cat /tmp/screenshot.png | wl-copy -t image/png"]);
        layer.close();
    }
    let hasSelection = false;
</script>

<div class="relative w-full h-full" draggable="false">
    <Mask bind:this={mask}></Mask>
    <Selector bind:this={selector} bind:hasSelection bind:selection onstop={screenshot}></Selector>
</div>
