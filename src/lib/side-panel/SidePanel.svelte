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
    let ns: Notification[] = [];
    let previousGroupCount = 0;

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
</script>

<FullscreenPanel>
    <div
        class="absolute top-0 right-0 h-full bg-[var(--bg)] rounded-sm pl-4 pt-4 pb-4 gap-2 flex flex-col pointer-events-auto shadow-[0_10px_40px_-24px_rgba(0,0,0,0.6)]"
        style:width="400px"
        transition:fly={{ x: 28, duration: 180, easing: cubicOut }}
    >
        <ClockCard />

        <NotificationControls {notify} {dnd} {state} notificationCount={ns.length} />

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
