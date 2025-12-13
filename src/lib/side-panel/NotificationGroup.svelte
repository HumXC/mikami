<script lang="ts">
    import { ChevronDown, ChevronUp, AppWindowMac } from "lucide-svelte";
    import type { Notification } from "../bar/services";
    import NotificationItem from "./NotificationItem.svelte";
    import SwipeToDelete from "../components/SwipeToDelete.svelte";
    import { slide, fade, fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    export let appName: string;
    export let notifications: Notification[];

    let expanded = false;

    // 获取第一个通知作为预览
    $: firstNotification = notifications[0];
    $: count = notifications.length;
    $: if (count <= 1 && expanded) expanded = false;

    function handleGroupDelete() {
        notifications.forEach((n) => n.dismiss());
    }

    function toggleExpanded() {
        if (count > 1) {
            expanded = !expanded;
        }
    }

    function handleSingleClick() {
        if (count === 1) {
            firstNotification.activate();
            firstNotification.dismiss();
        }
    }

    function handleSingleDelete() {
        if (count === 1) {
            firstNotification.dismiss();
        }
    }
</script>

<div class="flex flex-col gap-2">
    <!-- 头部 - 单条和多条都显示 -->
    <SwipeToDelete
        onClick={count === 1 ? handleSingleClick : toggleExpanded}
        onDelete={count === 1 ? handleSingleDelete : handleGroupDelete}
        rightGap={16}
        disabled={count > 1 && expanded}
    >
        <div
            role="button"
            tabindex="0"
            class="group flex p-3 pr-4 items-center gap-2 bg-[var(--bg2)] rounded-sm relative transition-all duration-200 hover:bg-opacity-80 cursor-pointer w-full"
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (count === 1) {
                        handleSingleClick();
                    } else {
                        toggleExpanded();
                    }
                }
            }}
        >
            {#if count === 1}
                <!-- 单条通知显示应用名 -->
                <span class="opacity-50 text-sm absolute right-2 top-2 z-10">{appName}</span>
            {/if}

            {#await firstNotification.getIcon() then image}
                {#if image === null}
                    <AppWindowMac
                        class="flex-shrink-0 p-2 w-12 h-12 bg-[var(--bg2)] rounded-xl z-10"
                    />
                {:else}
                    <img class="flex-shrink-0 w-12 h-12 rounded-xl z-10" src={image} alt="icon" />
                {/if}
            {/await}

            <div class="flex flex-col overflow-hidden flex-grow z-10">
                {#if count === 1}
                    <!-- 单条通知的内容 -->
                    <div class="flex items-center gap-1">
                        <span class="text-lg">{firstNotification.summary}</span>
                        <span class="text-sm opacity-50 flex flex-grow"
                            >{firstNotification.date}</span
                        >
                    </div>
                    <span class="text-sm truncate opacity-50">{firstNotification.body}</span>
                {:else}
                    <!-- 多条通知的内容 -->
                    <div class="flex items-center gap-2">
                        <span class="text-lg font-medium">{appName}</span>
                        <span class="text-xs bg-[var(--bg)] px-2 py-0.5 rounded-full opacity-70">
                            {count} 条通知
                        </span>
                    </div>
                    <span class="text-sm opacity-50 truncate">
                        {firstNotification.summary}
                        {#if count > 1}
                            <span class="ml-1">+ {count - 1} 条更多</span>
                        {/if}
                    </span>
                {/if}
            </div>

            {#if count > 1}
                <div class="flex-shrink-0 ml-2 transition-transform duration-200 z-10">
                    {#if expanded}
                        <ChevronUp class="w-5 h-5" />
                    {:else}
                        <ChevronDown class="w-5 h-5" />
                    {/if}
                </div>
            {/if}
        </div>
    </SwipeToDelete>

    <!-- 展开的通知列表 - 仅多条时显示 -->
    {#if count > 1 && expanded}
        <div
            class="flex flex-col gap-2 ml-4"
            transition:slide={{ duration: 200, easing: cubicOut }}
        >
            {#each notifications as notification (notification.data.timestamp)}
                <NotificationItem {notification} />
            {/each}
        </div>
    {/if}
</div>
