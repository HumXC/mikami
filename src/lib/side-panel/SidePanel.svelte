<script lang="ts">
    import { Notification, NotificationService } from "../bar/services";
    import { flip } from "svelte/animate";
    import { cubicOut } from "svelte/easing";
    import { fly, fade } from "svelte/transition";
    import FullscreenPanel from "../components/FullscreenPanel.svelte";
    import ClockCard from "./ClockCard.svelte";
    import NotificationControls from "./NotificationControls.svelte";
    import NotificationGroup from "./NotificationGroup.svelte";

    let dnd = false;
    let state = "empty";
    const notify = new NotificationService();
    notify.showPopover = false;
    notify.onAdded = (n) => {
        ns = [n, ...ns];
    };
    notify.onRemoved = (id) => {
        ns = ns.filter((n) => n.id !== id);
    };
    notify.onDNDChanged = (value) => {
        dnd = value;
    };
    notify.onStateChanged = (value) => {
        state = value;
    };

    let ns: Notification[] = [];
    notify.ready().then(async () => {
        ns = (await notify.list()).reverse();
    });

    let panelWidth = 400;

    // 按 appName 分组通知
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

    // 清除全部通知的处理函数
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

    // 监听清除全部事件
    if (typeof window !== "undefined") {
        window.addEventListener("clearAll", handleClearAll);
    }
</script>

<FullscreenPanel>
    <div
        class="absolute top-0 right-0 h-full bg-[var(--bg)] rounded-sm pl-4 pt-4 pb-4 gap-2 flex flex-col pointer-events-auto shadow-[0_10px_40px_-24px_rgba(0,0,0,0.6)]"
        style:width="{panelWidth}px"
        transition:fly={{ x: 28, duration: 180, easing: cubicOut }}
    >
        <ClockCard />

        <NotificationControls {notify} {dnd} {state} notificationCount={ns.length} />

        <div class="flex flex-col gap-2 overflow-auto rounded-sm overflow-x-hidden h-full">
            {#if ns.length === 0}
                <div
                    class="text-center p-4 bg-[var(--bg2)] rounded-sm mr-2"
                    in:fade={{ duration: 150 }}
                >
                    <span class="opacity-50">没有待处理的通知</span>
                </div>
            {:else}
                {#each Object.entries(groupedNotifications) as [appName, notifications] (appName)}
                    <div
                        animate:flip={{ duration: 220, easing: cubicOut }}
                        in:fly={{ y: 6, duration: 150, easing: cubicOut }}
                        out:fade={{ duration: 120 }}
                    >
                        <NotificationGroup {appName} {notifications} />
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</FullscreenPanel>
