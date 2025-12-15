<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { layer, mpris, os } from "@mika-shell/core";
    import { SkipBack, SkipForward, Pause, Play, X } from "lucide-svelte";

    export let onBack: (() => void) | undefined = undefined;

    const POLL_MS = 1500;

    let players: mpris.Player[] = [];
    let active: mpris.Player | null = null;
    let status: mpris.PlayerStatus | null = null;
    let coverUrl: string | null = null;
    let title = "";
    let artist = "";
    let position = 0;
    let length = 0;
    let pollTimer: number | null = null;

    $: progress = length > 0 ? (position / length) * 100 : 0;

    function formatTime(microseconds: number): string {
        const totalSeconds = Math.floor(microseconds / 1_000_000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    async function pickActivePlayer() {
        try {
            players = await mpris.list();
            for (const p of players) {
                try {
                    const s = await p.getPlayerStatus();
                    if (s.playbackStatus === "Playing") {
                        active = p;
                        status = s;
                        updateMeta();
                        return;
                    }
                } catch {}
            }
            active = players[0] ?? null;
            if (active) {
                try {
                    status = await active.getPlayerStatus();
                    updateMeta();
                } catch {}
            } else {
                resetState();
            }
        } catch {
            resetState();
        }
    }

    function resetState() {
        players = [];
        active = null;
        status = null;
        coverUrl = null;
        title = "";
        artist = "";
    }

    function updateMeta() {
        const meta = status?.metadata;

        if (meta?.artUrl?.startsWith("file://")) {
            os.read(meta.artUrl.substring(7)).then((b64) => {
                coverUrl = `data:image/jpeg;base64,${b64}`;
            });
        } else {
            coverUrl = null;
        }

        title = meta?.title ?? meta?.asText ?? "";
        const artists = meta?.artist ?? meta?.albumArtist ?? [];
        artist = Array.isArray(artists) ? artists.join(", ") : String(artists ?? "");
        position = status?.position ?? 0;
        length = meta?.length ?? 0;
    }

    async function poll() {
        if (!active) return;
        try {
            status = await active.getPlayerStatus();
            updateMeta();
        } catch {}
    }

    async function refreshNow() {
        if (!active) return;
        try {
            status = await active.getPlayerStatus();
            updateMeta();
        } catch {}
    }

    async function ensurePlayer() {
        if (!active) await pickActivePlayer();
    }

    async function previous() {
        await ensurePlayer();
        try {
            await active?.previous();
        } catch {}
        await refreshNow();
    }

    async function playPause() {
        await ensurePlayer();
        if (status) {
            status = {
                ...status,
                playbackStatus: status.playbackStatus === "Playing" ? "Paused" : "Playing",
            };
        }
        try {
            await active?.playPause();
        } catch {}
        await refreshNow();
    }

    async function next() {
        await ensurePlayer();
        try {
            await active?.next();
        } catch {}
        await refreshNow();
    }

    async function raise() {
        await ensurePlayer();
        try {
            await active?.raise();
            layer.close();
        } catch {}
    }

    onMount(async () => {
        await pickActivePlayer();
        pollTimer = setInterval(poll, POLL_MS) as unknown as number;
    });

    onDestroy(() => {
        if (pollTimer) clearInterval(pollTimer);
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if active && status}
    <div
        class={`media-card ${coverUrl ? "has-cover" : ""}`}
        style={coverUrl ? `--cover:url('${coverUrl}')` : undefined}
        on:click={raise}
        in:fade={{ duration: 150 }}
    >
        {#if onBack}
            <button class="close-btn" on:click|stopPropagation={onBack} aria-label="关闭">
                <X class="close-icon" />
            </button>
        {/if}

        <div class="content-wrapper">
            <div class="cover-section">
                {#if coverUrl}
                    <img class="cover" src={coverUrl} alt="封面" />
                {:else}
                    <div class="cover placeholder">♪</div>
                {/if}
            </div>

            <div class="info-section">
                <div class="metadata">
                    <div class="title" {title}>{title || "正在播放"}</div>
                    <div class="artist" title={artist}>{artist || "未知艺术家"}</div>
                </div>

                <div class="controls">
                    <button
                        class="btn circle primary"
                        on:click|stopPropagation={previous}
                        aria-label="上一曲"
                    >
                        <SkipBack class="icon" />
                    </button>
                    <button
                        class="btn circle primary"
                        on:click|stopPropagation={playPause}
                        aria-label="暂停/播放"
                    >
                        {#if status.playbackStatus === "Playing"}
                            <Pause class="icon" />
                        {:else}
                            <Play class="icon" />
                        {/if}
                    </button>
                    <button
                        class="btn circle primary"
                        on:click|stopPropagation={next}
                        aria-label="下一曲"
                    >
                        <SkipForward class="icon" />
                    </button>
                </div>
            </div>
        </div>

        <div class="progress-section">
            <div class="time-display">
                <span class="current-time">{formatTime(position)}</span>
                <span class="total-time">{formatTime(length)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {progress}%"></div>
            </div>
        </div>
    </div>
{:else}
    <div class="media-card empty" in:fade={{ duration: 150 }}>
        <div class="placeholder">没有正在播放的媒体</div>
    </div>
{/if}

<style>
    .media-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        border-radius: 8px;
        background: rgba(var(--bg2-rgb, 28, 28, 35), 0.65);
        margin-right: 1rem;
        cursor: default;
        position: relative;
        overflow: hidden;
        isolation: isolate;
        box-shadow: 0 12px 36px -28px rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(12px);
    }

    .close-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: transparent;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 160ms ease;
        z-index: 10;
        padding: 0;
    }
    .close-btn::before {
        content: "";
        position: absolute;
        inset: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        transition: all 160ms ease;
        z-index: -1;
    }
    .close-btn:hover::before {
        background: rgba(255, 100, 100, 0.2);
        border-color: rgba(255, 100, 100, 0.3);
    }
    .close-btn:hover {
        transform: scale(1.05);
    }
    .close-icon {
        width: 16px;
        height: 16px;
        position: relative;
        z-index: 1;
        filter: none;
    }
    .media-card.empty {
        grid-template-columns: 1fr;
        cursor: default;
    }
    .media-card.has-cover::before {
        content: "";
        position: absolute;
        inset: -12%;
        background-image: var(--cover);
        background-size: cover;
        background-position: center;
        filter: blur(28px) saturate(1.2);
        opacity: 0.25;
        z-index: -1;
        transform: scale(1.05);
    }
    .media-card.has-cover::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 30% 30%, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
        z-index: -1;
    }
    .content-wrapper {
        display: flex;
        gap: 12px;
        align-items: center;
    }
    .cover-section {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
    }
    .cover {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 8px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        background: rgba(255, 255, 255, 0.04);
    }
    .cover.placeholder {
        font-size: 48px;
        color: rgba(255, 255, 255, 0.5);
        display: grid;
        place-items: center;
    }
    .info-section {
        display: flex;
        flex-direction: column;
        gap: 24px;
        flex: 1;
        min-width: 0;
    }
    .metadata {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .title {
        font-size: 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 600;
    }
    .artist {
        font-size: 0.85rem;
        opacity: 0.7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .controls {
        --control-size: 42px;
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: flex-start;
        height: var(--control-size);
    }
    .progress-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .time-display {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        opacity: 0.7;
    }
    .progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
    }
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.4));
        border-radius: 2px;
        transition: width 0.3s ease;
    }
    .btn {
        background: var(--bg3, rgba(255, 255, 255, 0.06));
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: inherit;
        transition:
            transform 120ms ease,
            background 160ms ease,
            border-color 160ms ease;
        padding: 0; /* avoid affecting final box size */
        line-height: 1; /* normalize inline box height */
    }
    .btn:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
    }
    .btn.circle {
        width: var(--control-size);
        height: var(--control-size);
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
        box-sizing: border-box; /* include 1px border in the final size */
        line-height: 1; /* prevent font metrics from affecting height */
        padding: 0; /* avoid padding expanding the box */
        flex: 0 0 var(--control-size);
        vertical-align: middle;
        cursor: pointer; /* hand cursor over controls */
    }
    .btn.primary {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
        border-color: rgba(255, 255, 255, 0.18);
        box-shadow: 0 8px 24px -16px rgba(0, 0, 0, 0.8);
    }
    .btn.danger {
        color: #ff8787;
        border-color: rgba(255, 135, 135, 0.35);
    }
    .icon {
        width: calc(var(--control-size) * 0.48);
        height: calc(var(--control-size) * 0.48);
    }
    .placeholder {
        opacity: 0.6;
    }
</style>
