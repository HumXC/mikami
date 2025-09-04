<script lang="ts">
    import { layer, notifd, icon, mika } from "@mika-shell/core";
    import { onMount, tick } from "svelte";
    import { flip } from "svelte/animate";
    import { cubicOut } from "svelte/easing";
    import { getHashSearchParams } from "../../utils";
    const width = 340;
    const itemHeight = 80;
    let height = itemHeight;
    const itemGap = 8;
    let ns: notifd.Notification[] = $state([]);
    const timer: Map<number, number> = new Map();
    const animeDuration = 350;
    const timeout = 3000;
    layer.init({
        namespace: "notification",
        layer: "top",
        anchor: ["right", "top"],
        margin: [8, 8, 0, 0],
        autoExclusiveZone: true,
        backgroundTransparent: true,
        height: height,
        width: width,
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
    let closeTimer = 0;
    const updateHeight = () => {
        height = itemHeight * ns.length + itemGap * (ns.length <= 0 ? 0 : ns.length - 1);
        layer.setSize(width, height === 0 ? 1 : height);
        if (height === 0) {
            closeTimer = setTimeout(() => {
                layer.close();
            }, 1000);
        }
    };
    let updateHeightTimer = 0;
    const closeNotification = (id: number) => {
        ns = ns.filter((n) => n.id !== id);
        updateHeightTimer = setTimeout(updateHeight, animeDuration * 2 + 10);
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
    const createNotification = async (id: number) => {
        const n = await notifd.get(id);
        setTimer(n.id);
        ns = [n, ...ns];
        if (updateHeightTimer) clearTimeout(updateHeightTimer);
        if (closeTimer) clearTimeout(closeTimer);
        await tick();
        updateHeight();
    };
    onMount(() => {
        notifd.on("added", createNotification);
        notifd.on("removed", closeNotification);
        const parmas = getHashSearchParams();
        const start = parmas.get("start");
        const ns_: notifd.Notification[] = JSON.parse(localStorage.getItem("notify-items") || "[]");
        for (const n of ns_.slice(Number(start) || 0)) {
            createNotification(n.id);
        }
        return () => {
            notifd.off("added", createNotification);
            notifd.off("removed", closeNotification);
        };
    });

    const onClick = (id: number) => {
        notifd.activate(id);
        closeNotification(id);
    };
    const getImage = async (n: notifd.Notification): Promise<string | undefined> => {
        if (n.hints.imageData) return n.hints.imageData.base64;
        if (n.hints.imagePath) return await icon.lookup(n.hints.imagePath, 256);
        if (n.appIcon) return await icon.lookup(n.appIcon, 256);
        if (n.appName) return await icon.lookup(n.appName, 256);
        return undefined;
    };
</script>

<div class="w-full h-full flex flex-col justify-start items-right">
    {#each ns as n (n.id)}
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
            onclick={() => onClick(n.id)}
            onmouseenter={() => clearTimer(n.id)}
            onmouseleave={() => setTimer(n.id)}
        >
            {#await getImage(n)}
                <img
                    class="rounded-xl h-full aspect-square object-cover"
                    alt="notification_image"
                />
            {:then image}
                <img
                    class="rounded-xl h-full aspect-square object-cover"
                    src={image}
                    alt="notification_image"
                />
            {/await}
            <div class="flex flex-col justify-start items-start w-full">
                <div class="w-full flex justify-between items-center">
                    <span class="font-bold text-sm truncate">{n.summary}</span>
                    <span class="text-xs text-gray-500">{n.appName}</span>
                </div>
                <span class="text-gray-300 text-xs text-ellipsis line-clamp-2">{n.body}</span>
            </div>
        </div>
    {/each}
</div>

<style>
    .item {
        background: #000308b1;
    }
</style>
