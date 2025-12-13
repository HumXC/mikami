<script lang="ts">
    import { layer, os } from "@mika-shell/core";
    import hotkeys from "hotkeys-js";
    import SelectionBox from "../components/SelectionBox.svelte";

    let pid: number | null = null;
    let file: string | null = null;
    let showDashedBox = false;
    const channel = new BroadcastChannel("wf-recorder");
    channel.onmessage = (e) => {
        if (e.data == "request-state" && pid !== null) {
            channel.postMessage({
                state: "recording",
                file: file,
                region: {
                    x: selection.x,
                    y: selection.y,
                    w: selection.w,
                    h: selection.h,
                },
                startTime: startTime,
            });
        }
        if (e.data == "request-stop") {
            layer.close();
        }
    };
    let startTime: Date | null = null;
    type Rectangle = { x: number; y: number; w: number; h: number };

    let selection: Rectangle = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
    };
    let hasSelection = false;

    layer
        .init({
            keyboardMode: "exclusive",
            namespace: "screenshot",
            anchor: ["bottom", "left", "right", "top"],
            layer: "overlay",
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
        if (!hasSelection) return;
        const x = selection.x;
        const y = selection.y;
        const w = selection.w;
        const h = selection.h;

        showDashedBox = true;

        const dir = getOptionOr("wf-recorder-file", "/tmp");
        file = getFilename(dir);
        const audio = getOptionOr("wf-recorder-audio", null);
        const device = getOptionOr("wf-recorder-device", null);
        const codec = getOptionOr("wf-recorder-codec", null);
        const audioCodec = getOptionOr("wf-recorder-audio-codec", null);
        const framerate = getOptionOr("wf-recorder-framerate", null);
        const codecParam = getOptionOr("wf-recorder-codec-param", null);
        const audioBackend = getOptionOr("wf-recorder-audio-backend", null);
        const cmd = [
            "wf-recorder",
            "-f",
            file,
            `--geometry=${x},${y} ${w}x${h}`,
            `${audio ? "--audio=" + audio : ""}`,
            `${audioBackend ? "--audio-backend=" + audioBackend : ""}`,
            `${device ? "--device=" + device : ""}`,
            `${codec ? "--codec=" + codec : ""}`,
            `${audioCodec ? "--audio-codec=" + audioCodec : ""}`,
            `${framerate ? "--framerate=" + framerate : ""}`,
            `${codecParam ? "--codec-param=" + codecParam : ""}`,
        ].filter((c) => c.length > 0);
        pid = await os.execAsync(cmd);
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
            startTime: startTime,
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
        hasSelection = true;
        action();
    });
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
</script>

<div class="relative w-full h-full" draggable="false">
    <SelectionBox bind:hasSelection bind:selection visible={!showDashedBox} onstop={action}
    ></SelectionBox>
    {#if showDashedBox}
        <div
            id="dashed-highlight"
            style:width={selection.w + 1 + "px"}
            style:height={selection.h + 1 + "px"}
            style:left={selection.x - 1 + "px"}
            style:top={selection.y - 1 + "px"}
        ></div>
    {/if}
</div>

<style>
    #dashed-highlight {
        position: absolute;
        z-index: 50;
        outline: 2px dashed #ffffffca;
        background-color: transparent;
        pointer-events: none;
    }
</style>
