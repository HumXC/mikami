<script lang="ts">
    import { AppWindowMac } from "lucide-svelte";
    import type { Notification } from "../bar/services";
    import SwipeToDelete from "../components/SwipeToDelete.svelte";

    export let notification: Notification;

    function handleClick() {
        notification.activate();
        notification.dismiss();
    }

    function handleDelete() {
        notification.dismiss();
    }
</script>

<SwipeToDelete onClick={handleClick} onDelete={handleDelete} rightGap={16}>
    <div
        class="group flex p-3 pr-4 items-center gap-2 bg-[var(--bg2)] rounded-sm relative transition-all duration-200 hover:bg-opacity-80 cursor-pointer w-full"
    >
        <span class="opacity-50 text-sm absolute right-2 top-2 z-10"
            >{notification.data.appName}</span
        >

        {#await notification.getIcon() then image}
            {#if image === null}
                <AppWindowMac class="flex-shrink-0 p-2 w-12 h-12 bg-[var(--bg2)] rounded-xl z-10" />
            {:else}
                <img class="flex-shrink-0 w-12 h-12 rounded-xl z-10" src={image} alt="icon" />
            {/if}
        {/await}

        <div class="flex flex-col overflow-hidden flex-grow z-10">
            <div class="flex items-center gap-1">
                <span class="text-lg">{notification.summary}</span>
                <span class="text-sm opacity-50 flex flex-grow">{notification.date}</span>
            </div>
            <span class="n-body text-sm truncate opacity-50">{notification.body}</span>
        </div>
    </div>
</SwipeToDelete>
