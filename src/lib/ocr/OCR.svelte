<script lang="ts">
    import { onMount } from "svelte";
    import { createWorker, type Worker } from "tesseract.js";
    import Mask from "../screenshot/Mask.svelte";
    import Selector from "../screenshot/Selector.svelte";
    import { layer, os } from "@mika-shell/core";
    import hotkeys from "hotkeys-js";
    let mask: Mask;
    let selection: Rectangle;
    let ready: boolean = false;
    let hasSelection: boolean = false;
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
    hotkeys("f12", (e) => {
        e.stopPropagation();
        layer.openDevTools();
    });

    type Rectangle = { x: number; y: number; w: number; h: number };
    let worker: Worker;
    onMount(async () => {
        worker = await createWorker(["eng", "chi_sim"]);
    });
    async function recognize() {
        if (!hasSelection) return;
        const img = await mask.crop(selection);
        const result = await worker.recognize(img);
        if (result.data.text.length > 0) {
            await os.exec(["sh", "-c", `echo "${result.data.text}" | wl-copy`]);
        }
        layer.close();
    }
</script>

<div class="relative w-full h-full" draggable="false">
    <Mask bind:this={mask} bind:ready></Mask>
    <Selector bind:hasSelection bind:selection onstop={recognize}></Selector>
</div>
