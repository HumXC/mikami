<script lang="ts">
    import { layer, mika, os } from "@mika-shell/core";
    import { UserCircleIcon, ScissorsIcon, SearchIcon } from "lucide-svelte";
    import dayjs from "dayjs";
    import relativeTime from "dayjs/plugin/relativeTime";
    import duration from "dayjs/plugin/duration";
    dayjs.extend(relativeTime);
    dayjs.extend(duration);
    layer.init({
        layer: "top",
        anchor: ["top"],
        width: 600,
        height: 300,
        backgroundTransparent: true,
        margin: [8, 0, 0, 0],
    });
    let user: os.UserInfo | null = null;
    let sys: os.SystemInfo | null = null;
    os.getUserInfo().then((u) => (user = u));
    os.getSystemInfo().then((s) => (sys = s));
    dayjs.locale("custom", {
        name: "custom",
        weekdays: ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
        formats: {
            LT: "HH:mm",
            LTS: "HH:mm:ss",
            L: "YYYY-MM-DD",
            LL: "YYYY年MM月DD日",
            LLL: "YYYY年MM月DD日 HH:mm",
            LLLL: "YYYY年MM月DD日dddd HH:mm",
        },
        relativeTime: {
            future: "in %s",
            past: "%s ago",
            s: "1s",
            m: "1m",
            mm: "%dm",
            h: "1h",
            hh: "%dh",
            d: "1d",
            dd: "%dd",
            M: "1M",
            MM: "%dM",
            y: "1y",
            yy: "%dy",
        },
    });
    const now = dayjs();
    let isRecording = false;
    const channel = new BroadcastChannel("wf-recorder");
    channel.onmessage = (event) => {
        if (event.data.state === "recording") {
            isRecording = true;
            const now = dayjs();
            recordDuration = now.diff(dayjs(event.data.startTime), "seconds");
            if (recordInterval) {
                clearInterval(recordInterval);
            }
            recordInterval = setInterval(() => {
                recordDuration += 1;
            }, 1000);
        }
        if (event.data.state === "done") {
            isRecording = false;
            recordDuration = 0;
            if (recordInterval) {
                clearInterval(recordInterval);
            }
        }
    };
    let recordDuration = 0;
    let recordInterval: number | null = null;
    channel.postMessage("request-state");
    function formatDuration(seconds: number, hideSeconds = false) {
        seconds = Math.floor(seconds); // 向下取整
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        let result = "";
        if (d) result += d + "d";
        if (h) result += h + "h";
        if (m) result += m + "m";
        if (!hideSeconds && ((!d && !h && !m) || s)) result += s + "s"; // 控制是否显示秒
        return result;
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_missing_attribute -->
<div
    id="toolbar"
    class="w-full h-full rounded-lg flex flex-col p-4 gap-2"
    onmouseleave={() => {
        layer.close();
    }}
>
    <div id="info" class="flex flex-row w-full items-center h-18 p-2 rounded-lg">
        {#if user !== null && sys !== null}
            <div class="flex justify-center h-16 w-16 items-center rounded-full">
                {#if user.avatar !== null}
                    <img src={user.avatar} class="rounded-full" />
                {:else}
                    <UserCircleIcon size={64} />
                {/if}
            </div>
            <div class="flex flex-col justify-start h-full w-full ml-4">
                <span class="pt-1 font-bold text-white text-lg">{user.gecos}</span>
                <span>{sys.hostname} / {sys.prettyName}</span>
            </div>
        {/if}
    </div>
    <div class="flex flex-row w-full h-full gap-2">
        <div id="tips" class="flex flex-col w-full h-full rounded-lg pl-2 p-1">
            <span class="text-lg">{now.format("YYYY 年 MM 月 DD 日")}</span>
            <span class="text-lg">{now.format("dddd HH:mm A")}</span>
            <br />
            {#if sys}
                <span>Uptime: {formatDuration(sys.uptime, true)}</span>
            {/if}
        </div>
        <!-- 防止撑大grid -->
        <div id="tools" class="aspect-square h-full rounded-lg grid grid-cols-2 grid-rows-2 gap-2">
            <button
                onclick={() => {
                    document.body.style.visibility = "hidden";
                    mika.open("screenshot");
                    layer.close();
                }}
                class="flex flex-col justify-center items-center"
            >
                <ScissorsIcon size={32} class="mb-2" />
                <span class="absolute bottom-0 text-sm pb-1">截图</span>
            </button>
            <button
                class="flex flex-col justify-center items-center"
                onclick={() => {
                    if (isRecording) {
                        channel.postMessage("request-stop");
                    } else {
                        document.body.style.visibility = "hidden";
                        mika.open("wf-recorder");
                    }
                    layer.close();
                }}
            >
                <div class="flex justify-center items-center w-10 h-10 rounded-full border-2 mb-2">
                    <div
                        style:background-color={isRecording ? "red" : ""}
                        class="w-6 h-6 rounded-full bg-gray-200"
                        class:animate-pulse={isRecording}
                    ></div>
                </div>
                <span class="absolute bottom-0 text-sm pb-1"
                    >{isRecording ? formatDuration(recordDuration) : "录屏"}</span
                >
            </button>
            <button
                onclick={() => {
                    document.body.style.visibility = "hidden";
                    mika.open("ocr");
                    layer.close();
                }}
                class="flex flex-col justify-center items-center"
            >
                <SearchIcon size={32} class="mb-2" />
                <span class="absolute bottom-0 text-sm pb-1">文字识别</span>
            </button>
            <button>4</button>
        </div>
    </div>
</div>

<style>
    #toolbar {
        background-color: var(--bg);
    }
    #info {
        background-color: var(--bg3);
    }
    button,
    #tips {
        background-color: var(--bg2);
        color: #ffffffc6;
    }
    button {
        border-radius: 8px;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        transition: background-color 0.3s ease;
        position: relative;
    }
    button:hover {
        background-color: var(--selected);
        cursor: pointer;
    }
</style>
