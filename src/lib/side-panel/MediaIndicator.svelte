<script lang="ts">
    import { Music, ChevronRight } from "lucide-svelte";

    export let coverUrl: string | null = null;
    export let isPlaying = false;
    export let onClick: () => void;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="media-indicator" class:playing={isPlaying} on:click={onClick}>
    <div class="cover-preview">
        {#if coverUrl}
            <img src={coverUrl} alt="封面" draggable="false" />
        {:else}
            <Music class="music-icon" />
        {/if}
    </div>
    <div class="animated-bg" class:playing={isPlaying}>
        <div class="gradient-wave"></div>
    </div>
    <ChevronRight class="arrow" />
</div>

<style>
    .media-indicator {
        --h: 40px;
        position: absolute;
        bottom: 12px;
        right: 28px;
        display: flex;
        align-items: center;
        gap: 8px;
        height: var(--h);
        padding: 0 10px 0 6px;
        border-radius: calc(var(--h) / 2);
        cursor: pointer;
        overflow: hidden;
        backdrop-filter: blur(16px);
        box-shadow: 0 8px 32px -12px rgba(0, 0, 0, 0.6);
        transition:
            transform 160ms ease,
            box-shadow 160ms ease;
        z-index: 10;
    }

    .media-indicator:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.7);
    }

    .cover-preview {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
        flex-shrink: 0;
        position: relative;
        z-index: 2;
    }

    .cover-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .animated-bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        background: rgba(120, 120, 130, 0.4);
    }

    .animated-bg.playing {
        background: linear-gradient(
            90deg,
            rgba(255, 100, 150, 0.5),
            rgba(150, 100, 255, 0.5),
            rgba(100, 200, 255, 0.5),
            rgba(255, 200, 100, 0.5)
        );
        background-size: 300% 100%;
        animation: gradientFlow 4s ease-in-out infinite;
    }

    @keyframes gradientFlow {
        0%,
        100% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
    }

    .gradient-wave {
        position: absolute;
        inset: 0;
        opacity: 0;
    }

    .playing .gradient-wave {
        opacity: 0.6;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        background-size: 200% 100%;
        animation: wave 2s linear infinite;
    }

    @keyframes wave {
        0% {
            background-position: -200% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }
</style>
