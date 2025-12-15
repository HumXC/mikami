<script lang="ts">
    import { layer, mika, os } from "@mika-shell/core";
    import { UserCircleIcon, ScissorsIcon, SearchIcon } from "lucide-svelte";
    import dayjs from "dayjs";
    import relativeTime from "dayjs/plugin/relativeTime";
    import duration from "dayjs/plugin/duration";
    import { onDestroy } from "svelte";
    import FullscreenPanel from "../components/FullscreenPanel.svelte";

    // 常量
    const CLOSE_DELAY = 500;
    const TOOLBAR_WIDTH = "600px";
    const TOOLBAR_HEIGHT = "300px";

    // 初始化 dayjs
    dayjs.extend(relativeTime);
    dayjs.extend(duration);
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

    // 状态变量
    let user: os.UserInfo | null = null;
    let sys: os.SystemInfo | null = null;
    let isRecording = false;
    let recordDuration = 0;
    let recordInterval: number | null = null;
    let closeTimer: number = 0;
    const now = dayjs();

    // 录屏广播频道
    const channel = new BroadcastChannel("wf-recorder");

    // 工具函数
    function formatDuration(seconds: number, hideSeconds = false): string {
        seconds = Math.floor(seconds);
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        let result = "";
        if (d) result += `${d}d`;
        if (h) result += `${h}h`;
        if (m) result += `${m}m`;
        if (!hideSeconds && ((!d && !h && !m) || s)) result += `${s}s`;
        return result || "0s";
    }

    function hideBodyAndClose() {
        document.body.style.visibility = "hidden";
        layer.close();
    }

    function handleScreenshot() {
        hideBodyAndClose();
        mika.open("screenshot");
    }

    function handleRecord() {
        if (isRecording) {
            channel.postMessage("request-stop");
        } else {
            hideBodyAndClose();
            mika.open("wf-recorder");
        }
    }

    function handleOCR() {
        hideBodyAndClose();
        mika.open("ocr");
    }

    function handleMouseLeave() {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            layer.close();
        }, CLOSE_DELAY);
    }

    function handleMouseEnter() {
        clearTimeout(closeTimer);
    }

    // 录屏状态处理
    channel.onmessage = (event) => {
        if (event.data.state === "recording") {
            isRecording = true;
            const startTime = dayjs(event.data.startTime);
            recordDuration = dayjs().diff(startTime, "seconds");

            if (recordInterval) clearInterval(recordInterval);
            recordInterval = setInterval(() => {
                recordDuration += 1;
            }, 1000);
        } else if (event.data.state === "done") {
            isRecording = false;
            recordDuration = 0;
            if (recordInterval) {
                clearInterval(recordInterval);
                recordInterval = null;
            }
        }
    };

    // 初始化
    os.getUserInfo().then((u) => (user = u));
    os.getSystemInfo().then((s) => (sys = s));
    channel.postMessage("request-state");

    // 清理
    onDestroy(() => {
        if (recordInterval) clearInterval(recordInterval);
        if (closeTimer) clearTimeout(closeTimer);
        channel.close();
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<FullscreenPanel anchor={["top"]} onClick={layer.close} onEscape={layer.close}>
    <div
        id="toolbar"
        class="toolbar-container"
        style:width={TOOLBAR_WIDTH}
        style:height={TOOLBAR_HEIGHT}
        onmouseleave={handleMouseLeave}
        onmouseenter={handleMouseEnter}
    >
        <!-- 用户信息区域 -->
        <div id="info" class="info-section">
            {#if user !== null && sys !== null}
                <div class="avatar-container">
                    {#if user.avatar !== null}
                        <img src={user.avatar} alt="User avatar" class="avatar-image" />
                    {:else}
                        <UserCircleIcon size={64} />
                    {/if}
                </div>
                <div class="user-info">
                    <span class="user-name">{user.gecos}</span>
                    <span class="system-info">{sys.hostname} / {sys.prettyName}</span>
                </div>
            {/if}
        </div>

        <!-- 内容区域 -->
        <div class="content-section">
            <!-- 提示信息 -->
            <div id="tips" class="tips-section">
                <span class="date-text">{now.format("YYYY 年 MM 月 DD 日")}</span>
                <span class="time-text">{now.format("dddd HH:mm A")}</span>
                {#if sys}
                    <div class="uptime-info">
                        <span>运行时长: {formatDuration(sys.uptime, true)}</span>
                    </div>
                {/if}
            </div>

            <!-- 工具按钮 -->
            <div id="tools" class="tools-grid">
                <button onclick={handleScreenshot} class="tool-button" aria-label="截图">
                    <ScissorsIcon size={32} class="tool-icon" />
                    <span class="tool-label">截图</span>
                </button>

                <button
                    onclick={handleRecord}
                    class="tool-button"
                    aria-label={isRecording ? "停止录屏" : "开始录屏"}
                >
                    <div class="record-icon-container">
                        <div class="record-dot" class:recording={isRecording}></div>
                    </div>
                    <span class="tool-label">
                        {isRecording ? formatDuration(recordDuration) : "录屏"}
                    </span>
                </button>

                <button onclick={handleOCR} class="tool-button" aria-label="文字识别">
                    <SearchIcon size={32} class="tool-icon" />
                    <span class="tool-label">文字识别</span>
                </button>

                <button class="tool-button" aria-label="功能4">
                    <span class="tool-label">功能4</span>
                </button>
            </div>
        </div>
    </div>
</FullscreenPanel>

<style>
    /* 主容器 */
    .toolbar-container {
        background-color: var(--bg);
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        gap: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }

    /* 用户信息区域 */
    .info-section {
        background-color: var(--bg3);
        display: flex;
        flex-direction: row;
        width: 100%;
        align-items: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        min-height: 4.5rem;
    }

    .avatar-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 4rem;
        width: 4rem;
        border-radius: 9999px;
        overflow: hidden;
        flex-shrink: 0;
    }

    .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 9999px;
    }

    .user-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-left: 1rem;
        flex: 1;
        min-width: 0;
    }

    .user-name {
        padding-top: 0.25rem;
        font-weight: bold;
        color: white;
        font-size: 1.125rem;
        line-height: 1.75rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .system-info {
        color: #ffffffc6;
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* 内容区域 */
    .content-section {
        display: flex;
        flex-direction: row;
        width: 100%;
        flex: 1;
        gap: 0.5rem;
        min-height: 0;
    }

    /* 提示信息 */
    .tips-section {
        background-color: var(--bg2);
        color: #ffffffc6;
        display: flex;
        flex-direction: column;
        width: 100%;
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        justify-content: center;
        gap: 0.25rem;
    }

    .date-text,
    .time-text {
        font-size: 1.125rem;
        line-height: 1.75rem;
    }

    .uptime-info {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        opacity: 0.8;
    }

    /* 工具网格 */
    .tools-grid {
        aspect-ratio: 1;
        height: 100%;
        border-radius: 0.5rem;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 0.5rem;
    }

    /* 工具按钮 */
    .tool-button {
        background-color: var(--bg2);
        color: #ffffffc6;
        border-radius: 0.5rem;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        transition: background-color 0.2s ease;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
    }

    .tool-button:hover {
        background-color: var(--selected);
    }

    .tool-button:active {
        opacity: 0.8;
    }

    .tool-label {
        position: absolute;
        bottom: 0;
        font-size: 0.875rem;
        padding-bottom: 0.25rem;
        white-space: nowrap;
    }

    /* 录屏按钮特殊样式 */
    .record-icon-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border: 2px solid currentColor;
        margin-bottom: 0.5rem;
        border-radius: 9999px;
    }

    .record-dot {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 9999px;
        background-color: #e5e7eb;
        transition: background-color 0.3s ease;
    }

    .record-dot.recording {
        background-color: #ef4444;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
</style>
