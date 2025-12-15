<script lang="ts">
    import { Notification, NotificationService } from "../bar/services";
    import { flip } from "svelte/animate";
    import { cubicOut } from "svelte/easing";
    import { fly, fade } from "svelte/transition";
    import FullscreenPanel from "../components/FullscreenPanel.svelte";
    import ClockCard from "./ClockCard.svelte";
    import MediaCard from "./MediaCard.svelte";
    import MediaIndicator from "./MediaIndicator.svelte";
    import { onMount } from "svelte";
    import { layer, mpris } from "@mika-shell/core";
    import NotificationControls from "./NotificationControls.svelte";
    import NotificationGroup from "./NotificationGroup.svelte";

    let ns: Notification[] = [];
    let previousGroupCount = 0;

    // 媒体/时钟翻面控制
    let mediaAvailable = false;
    let face: "clock" | "media" = "clock";
    let mediaCoverUrl: string | null = null;
    let mediaIsPlaying = false;
    const MEDIA_POLL_MS = 2000;

    const notify = new NotificationService();
    notify.showPopover = false;
    notify.onAdded = (n) => {
        ns = [n, ...ns];
    };
    notify.onRemoved = (id) => {
        ns = ns.filter((n) => n.id !== id);
    };
    notify.ready().then(async () => {
        ns = (await notify.list()).reverse();
    });

    $: groupedNotifications = ns.reduce(
        (groups, notification) => {
            const appName = notification.data.appName || "未知应用";
            if (!groups[appName]) {
                groups[appName] = [];
            }
            groups[appName].push(notification);
            return groups;
        },
        {} as Record<string, Notification[]>
    );

    $: currentGroupCount = Object.keys(groupedNotifications).length;
    $: isFirstGroup = previousGroupCount === 0 && currentGroupCount === 1;
    $: {
        if (currentGroupCount > 0) {
            previousGroupCount = currentGroupCount;
        } else {
            previousGroupCount = 0;
        }
    }

    function handleClearAll() {
        for (const n of ns) {
            try {
                n.dismiss();
            } catch (e) {
                // ignore
            }
        }
        ns = [];
        notify.updateState();
    }

    if (typeof window !== "undefined") {
        window.addEventListener("clearAll", handleClearAll);
    }

    let mediaPoll: number | null = null;

    async function checkMedia() {
        let available = false;
        let coverUrl: string | null = null;
        let isPlaying = false;
        try {
            const players = await mpris.list();
            for (const p of players) {
                try {
                    const s = await p.getPlayerStatus();
                    if (s.playbackStatus === "Playing" || s.playbackStatus === "Paused") {
                        available = true;
                        isPlaying = s.playbackStatus === "Playing";
                        const artUrl = s.metadata?.artUrl;
                        if (artUrl?.startsWith("file://")) {
                            try {
                                const { os } = await import("@mika-shell/core");
                                const b64 = await os.read(artUrl.substring("file://".length));
                                coverUrl = "data:image/jpeg;base64," + b64;
                            } catch {}
                        }
                        break;
                    }
                } catch {}
            }
        } catch {
            available = false;
        }

        mediaAvailable = available;
        mediaCoverUrl = coverUrl;
        mediaIsPlaying = isPlaying;

        // 不再自动切换，只在媒体停止时回到时钟
        if (!mediaAvailable && face === "media") {
            face = "clock";
        }
    }

    function showClock() {
        face = "clock";
    }

    function showMedia() {
        if (!mediaAvailable) return;
        face = "media";
    }

    onMount(() => {
        checkMedia();
        mediaPoll = setInterval(checkMedia, MEDIA_POLL_MS) as unknown as number;
        return () => {
            if (mediaPoll) clearInterval(mediaPoll);
        };
    });
</script>

<FullscreenPanel onClick={layer.close} onEscape={layer.close} anchor={["right"]}>
    <div
        class=" h-full bg-[var(--bg)] rounded-sm pl-4 pt-4 pb-4 gap-2 flex flex-col pointer-events-auto shadow-[0_10px_40px_-24px_rgba(0,0,0,0.6)]"
        style:width="400px"
        transition:fly={{ x: 28, duration: 180, easing: cubicOut }}
    >
        <!-- 翻页卡片：媒体/时钟 -->
        <div class="card-switcher">
            <div class="flip-shell" data-face={face}>
                <div class="face face-clock">
                    <ClockCard />
                    {#if mediaAvailable}
                        <MediaIndicator
                            coverUrl={mediaCoverUrl}
                            isPlaying={mediaIsPlaying}
                            onClick={showMedia}
                        />
                    {/if}
                </div>
                <div class="face face-media">
                    <MediaCard onBack={showClock} />
                </div>
            </div>
        </div>

        <NotificationControls {notify} notificationCount={ns.length} />

        <div class="flex flex-col gap-2 overflow-auto rounded-sm overflow-x-hidden h-full relative">
            {#if ns.length === 0}
                <div
                    class="absolute inset-0 flex items-start justify-center pt-4 mr-2"
                    in:fade={{ duration: 150 }}
                    out:fade={{ duration: 150 }}
                >
                    <div class="text-center p-4 bg-[var(--bg2)] rounded-sm w-full">
                        <span class="opacity-50">没有待处理的通知</span>
                    </div>
                </div>
            {/if}
            {#each Object.entries(groupedNotifications) as [appName, notifications], i (appName)}
                <div
                    animate:flip={{ duration: 220, easing: cubicOut }}
                    in:fly={{
                        y: 6,
                        duration: 150,
                        easing: cubicOut,
                        delay: i === 0 && isFirstGroup ? 150 : 0,
                    }}
                    out:fade={{ duration: 120 }}
                >
                    <NotificationGroup {appName} {notifications} />
                </div>
            {/each}
        </div>
    </div>
</FullscreenPanel>

<style>
    .card-switcher {
        position: relative;
    }

    .flip-shell {
        position: relative;
        perspective: 1200px;
        min-height: 210px;
    }
    .face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        transform-style: preserve-3d;
        transition:
            transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1),
            opacity 320ms ease;
        pointer-events: none;
        opacity: 0;
    }
    .face-clock {
        transform: rotateY(0deg);
    }
    .face-media {
        transform: rotateY(180deg);
    }
    .flip-shell[data-face="media"] .face-clock {
        transform: rotateY(-180deg);
        opacity: 0;
    }
    .flip-shell[data-face="media"] .face-media {
        transform: rotateY(0deg);
        pointer-events: auto;
        opacity: 1;
    }
    .flip-shell[data-face="clock"] .face-clock {
        transform: rotateY(0deg);
        pointer-events: auto;
        opacity: 1;
    }
    .flip-shell[data-face="clock"] .face-media {
        transform: rotateY(180deg);
        opacity: 0;
    }

    /* 占位避免高度跳变 */
    .flip-shell::before {
        content: "";
        display: block;
        padding-top: 6px;
    }
    /* 仅让主要内容全高，排除右下角的媒体指示器 */
    .flip-shell .face :global(> div:not(.media-indicator)),
    .flip-shell .face :global(> .media-card) {
        height: 100%;
    }
</style>
