<script lang="ts">
    import { BellDotIcon, BellIcon, BellOffIcon, Trash } from "lucide-svelte";
    import type { NotificationService } from "../bar/services";

    export let notify: NotificationService;
    export let dnd: boolean;
    export let state: string;
    export let notificationCount: number;

    function toggleDND() {
        notify.doNotDisturb = !notify.doNotDisturb;
    }

    function clearAll() {
        // 这个函数会通过事件派发来处理
        const event = new CustomEvent("clearAll");
        window.dispatchEvent(event);
    }
</script>

<div class="mt-2 flex justify-end mr-4">
    <button
        class="group flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-[var(--bg2)] transition"
        on:click={toggleDND}
    >
        <div class="w-5 h-5 flex items-center justify-center transition-opacity duration-150">
            {#if dnd}
                <BellOffIcon class="w-5 h-5" />
            {:else if state === "notified"}
                <BellDotIcon class="w-5 h-5" />
            {:else if state === "empty"}
                <BellIcon class="w-5 h-5" />
            {/if}
        </div>

        <span
            class="inline-block max-w-0 overflow-hidden opacity-0 group-hover:max-w-[8rem] group-hover:opacity-100 transition-all duration-300 whitespace-nowrap"
        >
            {dnd ? "关闭勿扰" : "打开勿扰"}
        </span>
    </button>
    {#if notificationCount > 0}
        <button
            class="group flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-[var(--bg2)] transition ml-2"
            on:click={clearAll}
        >
            <div class="w-4 h-4 flex items-center justify-center transition-opacity duration-150">
                <Trash class="w-4 h-4" />
            </div>
            <span
                class="inline-block max-w-0 overflow-hidden opacity-0 group-hover:max-w-[8rem] group-hover:opacity-100 transition-all duration-300 whitespace-nowrap"
            >
                清除全部
            </span>
        </button>
    {/if}
</div>
