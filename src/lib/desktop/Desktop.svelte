<script lang="ts">
    import { layer, mika } from "@mika-shell/core";

    layer.init({
        namespace: "desktop",
        anchor: ["bottom", "right", "left", "top"],
        layer: "background",
        exclusiveZone: -1,
    });
    const hostpot = {};
    function setupHostpot(el: HTMLElement, anchor: string) {
        function onEnter() {
            if ((hostpot as any)[anchor]) {
                mika.open((hostpot as any)[anchor]);
            }
        }
        el.addEventListener("mouseenter", onEnter);
        return {
            destroy() {
                el.removeEventListener("mouseenter", onEnter);
            },
        };
    }
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div>
    <div
        class="w-full h-full bg-cover bg-center bg-[url('/wallpaper.jpg')] absolute top-0 left-0 right-0 bottom-0 z-0"
    ></div>
    <div class="hostpot h-full w-1 top-0 right-0" use:setupHostpot={"right"}></div>
</div>

<style>
    .hostpot {
        position: absolute;
        /* background-color: aqua; */
        z-index: 10;
    }
</style>
