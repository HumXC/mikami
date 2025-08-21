<script lang="ts">
    import { layer, os } from "@mika-shell/core";
    import hotkeys from "hotkeys-js";
    let pid: number | null = null;
    let file: string | null = null;
    const channel = new BroadcastChannel("wf-recorder");
    let startTime: Date | null = null;
    type Rectangle = { x: number; y: number; w: number; h: number };

    const selection: Rectangle = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
    };
    layer
        .init({
            keyboardMode: "exclusive",
            namespace: "screenshot",
            anchor: ["bottom", "left", "right", "top"],
            layer: "top",
            autoExclusiveZone: false,
            backgroundTransparent: true,
            exclusiveZone: -1,
        })
        .then(() => {
            layer.setInputRegion();
        });
    hotkeys("esc", (e) => {
        e.stopPropagation();
        layer.close();
    });
    function getOptionOr(key: string, defaultValue: any) {
        return localStorage.getItem(key) || defaultValue;
    }
    function getFilename(dir: string) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        return `${dir}/record_${y}-${m}-${d}_${hh}-${mm}-${ss}.mp4`;
    }
    async function action() {
        if (!hasSelection(selection)) return;
        console.log(selection);

        const x = selection.x;
        const y = selection.y;
        const w = selection.w;
        const h = selection.h;

        const dir = getOptionOr("wf-recorder-file", "/tmp");
        file = getFilename(dir);
        const audio = getOptionOr("wf-recorder-audio", "true") === "true";
        const device = getOptionOr("wf-recorder-device", null);
        const codec = getOptionOr("wf-recorder-codec", null);
        const audioCodec = getOptionOr("wf-recorder-audio-codec", null);
        const framerate = getOptionOr("wf-recorder-framerate", null);
        const codecParam = getOptionOr("wf-recorder-codec-param", null);
        const cmd = [
            "wf-recorder",
            "-f",
            file,
            `--geometry=${x},${y} ${w}x${h}`,
            `${audio ? "-a" : ""}`,
            `${device ? "--device=" + device : ""}`,
            `${codec ? "--codec=" + codec : ""}`,
            `${audioCodec ? "--audio-codec=" + audioCodec : ""}`,
            `${framerate ? "--framerate=" + framerate : ""}`,
            `${codecParam ? "--codec-param=" + codecParam : ""}`,
        ].filter((c) => c.length > 0);
        pid = await os.exec2(cmd);
        await layer.setKeyboardMode("none");
        layer.setInputRegion();
        startTime = new Date();
        channel.postMessage({
            state: "recording",
            file: file,
            region: {
                x,
                y,
                w,
                h,
            },
        });
    }
    layer.on("close-request", async () => {
        if (pid !== null) {
            os.exec(["sh", "-c", `kill -15 ${pid} | wl-copy file://${file} -t text/uri-list`]);
            const duration = (new Date().getTime() - (startTime as Date).getTime()) / 1000;
            channel.postMessage({ state: "done", file, duration });
        } else {
            channel.postMessage({ state: "cancel" });
        }
        return true;
    });
    hotkeys("f12", (e) => {
        e.stopPropagation();
        layer.openDevTools();
    });
    hotkeys("ctrl+a", (e) => {
        selection.x = 0;
        selection.y = 0;
        selection.w = window.innerWidth;
        selection.h = window.innerHeight;
        action();
    });
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
    function hasSelection(selection: Rectangle) {
        return selection.w > 0 && selection.h > 0;
    }
    let animationFrameId: number | null = null;
    let isDragging = false;
    let pointer = { x: 0, y: 0 };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="relative w-full h-full"
    draggable="false"
    style:cursor="crosshair"
    onmousedown={(e) => {
        if (pid !== null) return;
        isDragging = true;
        selection.w = 0;
        selection.h = 0;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
    }}
    onmousemove={(e) => {
        if (!isDragging || animationFrameId !== null) return;
        animationFrameId = requestAnimationFrame(() => {
            animationFrameId = null;
            let w = e.clientX - pointer.x + 1;
            let h = e.clientY - pointer.y + 1;
            selection.w = Math.abs(w);
            selection.h = Math.abs(h);
            selection.x = Math.min(e.clientX, pointer.x);
            selection.y = Math.min(e.clientY, pointer.y);
        });
    }}
    onmouseup={(e) => {
        if (pid !== null) return;
        isDragging = false;
        action();
    }}
>
    <div
        id="highlight"
        class="absolute z-50"
        class:dashed={pid !== null}
        style:width={selection.w + 1 + "px"}
        style:height={selection.h + 1 + "px"}
        style:left={selection.x - 1 + "px"}
        style:top={selection.y - 1 + "px"}
        style:opacity={hasSelection(selection) ? 1 : 0}
    ></div>
</div>

<style>
    #highlight {
        outline: 2px solid #fff;
        background-color: transparent;
        pointer-events: none;
    }
    .dashed {
        outline: 2px dashed #ffffffca !important;
    }
</style>
