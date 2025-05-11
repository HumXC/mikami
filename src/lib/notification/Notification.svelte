<script lang="ts">
    import { Layer, Notifd } from "@humxc/mikami";
    import { flip } from "svelte/animate";
    import { cubicOut } from "svelte/easing";
    const width = 340;
    const itemHeight = 80;
    let height = itemHeight;
    const itemGap = 8;
    let ns: Notifd.Notification[] = [];
    const timer: Map<number, number> = new Map();
    const animeDuration = 350;
    const timeout = 3000;
    Layer.Init({
        Title: "Notification",
        Layer: "top",
        Anchor: ["right", "top"],
        Margin: [50],
        AutoExclusiveZoneEnable: true,
        Height: height,
        Width: width,
    });
    function slideZoom(node: Element, { delay = 0, duration = 250 }) {
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

    const updateHeight = (delay = 0) => {
        height = itemHeight * ns.length + itemGap * (ns.length <= 0 ? 0 : ns.length - 1);
        Layer.SetSize(width, height);
    };
    let updateHeightTimer = 0;
    const closeNotification = (id: number) => {
        ns = ns.filter((n) => n.Id !== id);
        updateHeightTimer = setTimeout(
            () => {
                updateHeight();
            },
            animeDuration * 2 + 10
        );
    };
    const setTimer = (id: number) => {
        clearTimer(id);
        timer.set(
            id,
            setTimeout(() => {
                closeNotification(id);
            }, timeout)
        );
    };
    const clearTimer = (id: number) => {
        if (timer.has(id)) clearTimeout(timer.get(id));
    };
    const createNotification = async (n: Notifd.Notification) => {
        setTimer(n.Id);
        ns = [n, ...ns];
        if (updateHeightTimer) clearTimeout(updateHeightTimer);
        updateHeight();
    };
    Notifd.GetNotifications().then((ns_) => createNotification(ns_.pop()!));
    Notifd.Subscribe("notification", (n) => createNotification(n));
    Notifd.Subscribe("close-notification", (id) => closeNotification(id));
    const onClick = (id: number) => {
        Notifd.InvokeAction(id, "default");
        closeNotification(id);
    };
</script>

<div class="w-full h-full flex flex-col justify-start items-right px-2">
    {#each ns as n (n.Id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="item w-full rounded-xl p-3 flex gap-2"
            style="height: {itemHeight}px;margin-bottom: {itemGap}px;"
            transition:slideZoom={{ duration: animeDuration }}
            animate:flip={{
                duration: animeDuration,
                easing: cubicOut,
            }}
            onclick={() => onClick(n.Id)}
            onmouseenter={() => clearTimer(n.Id)}
            onmouseleave={() => setTimer(n.Id)}
        >
            <img
                class="rounded-xl h-full aspect-square object-cover"
                src={"data:image/png;base64," + n.Image}
                alt="image_"
            />
            <div class="flex flex-col justify-start items-start w-full">
                <div class="w-full flex justify-between items-center">
                    <span class="font-bold text-sm truncate">{n.Summary}</span>
                    <span class="text-xs text-gray-500">{n.AppName}</span>
                </div>
                <span class="text-gray-300 text-xs text-ellipsis line-clamp-2">{n.Body}</span>
            </div>
        </div>
    {/each}
</div>

<style>
    .item {
        background: #000308b1;
    }
</style>
