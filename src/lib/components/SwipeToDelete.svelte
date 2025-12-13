<script lang="ts" context="module">
    export interface SwipeToDeleteOptions {
        deleteThreshold?: number;
        clickTolerance?: number;
        onDelete?: () => void;
        onClick?: () => void;
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import { cubicOut } from "svelte/easing";

    export let onDelete: (() => void) | undefined = undefined;
    export let onClick: (() => void) | undefined = undefined;
    export let deleteThreshold = 150;
    export let clickTolerance = 5;
    export let rightGap = 16; // space to reserve on the right (e.g., for scrollbar)
    export let disabled = false; // 是否禁用滑动删除功能

    let swipeX = 0;
    let isDragging = false;
    let hasSwiped = false;
    let startX = 0;

    function slideZoomTransition(node: Element, { delay = 0, duration = 250 }) {
        return {
            delay,
            duration,
            easing: cubicOut,
            css: (t: number) => {
                const flyX = 100 * (1 - t);
                const s = 0.9 + 0.1 * t;
                return `
                transform: translateX(${flyX}px) scale(${s});
                opacity: ${t};
            `;
            },
        };
    }

    function smoothFade(node: Element, { delay = 0, duration = 150 }) {
        return {
            delay,
            duration,
            css: (t: number) => `opacity: ${t}`,
        };
    }

    function handleClick() {
        if (!hasSwiped && onClick) {
            onClick();
        }
    }

    function handleDismiss() {
        if (onDelete) {
            onDelete();
        }
    }
    function handleTouchStart(e: TouchEvent) {
        if (disabled) return;
        isDragging = true;
        hasSwiped = false;
        startX = e.touches[0].clientX;
    }

    function handleTouchMove(e: TouchEvent) {
        if (!isDragging || disabled) return;

        const deltaX = e.touches[0].clientX - startX;

        swipeX = deltaX;
        if (Math.abs(deltaX) > clickTolerance) {
            hasSwiped = true;
        }
    }

    function handleTouchEnd() {
        if (disabled) return;
        isDragging = false;

        if (Math.abs(swipeX) > deleteThreshold) {
            handleDismiss();
        } else {
            swipeX = 0;
        }
    }

    function handleMouseDown(e: MouseEvent) {
        if (disabled) return;
        if ((e.target as HTMLElement).closest("button")) {
            return;
        }

        isDragging = true;
        hasSwiped = false;
        startX = e.clientX;
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging || disabled) return;

        const deltaX = e.clientX - startX;

        swipeX = deltaX;
        if (Math.abs(deltaX) > clickTolerance) {
            hasSwiped = true;
        }
    }

    function handleMouseUp(e: MouseEvent) {
        if (disabled) return;
        if (!isDragging) {
            return;
        }

        isDragging = false;

        if (Math.abs(swipeX) > deleteThreshold) {
            handleDismiss();
        } else {
            swipeX = 0;
        }
    }

    // 监听全局鼠标事件
    onMount(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="relative overflow-hidden w-full"
    style:transform="translateX({swipeX}px)"
    style:transition={isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"}
    on:click={handleClick}
    on:mousedown={handleMouseDown}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    in:slideZoomTransition={{ duration: 200 }}
    out:smoothFade={{ duration: 100 }}
    role="button"
    tabindex="0"
>
    <!-- 背景删除区域 -->
    <div
        class="absolute inset-y-0 left-0 bg-red-600/60 pointer-events-none rounded-sm"
        style:opacity={Math.min(Math.abs(swipeX) / deleteThreshold, 1)}
        style:right={`${rightGap}px`}
    ></div>

    <!-- 内容插槽 -->
    <div class="relative z-10 w-full" style:padding-right={`${rightGap}px`}>
        <slot {swipeX} {isDragging} {hasSwiped} />
    </div>
</div>
