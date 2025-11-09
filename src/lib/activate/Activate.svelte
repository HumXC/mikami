<script lang="ts">
    import { layer } from "@mika-shell/core";
    layer.init({
        anchor: ["bottom", "right"],
        height: 160,
        width: 400,
        layer: "overlay",
        backgroundTransparent: true,
    });
    layer.setInputRegion();
</script>

<div class="opacity-40">
    <span class="font-light block text-4xl">激活 Windows</span>
    <span class="font-light block text-2xl">转到“设置”以激活 Windows。</span>
</div>
<!-- BUG: config.json 中设置自启但是 alias.json 中没有的时候会卡住 -->
