<script lang="ts">
    import { onMount } from "svelte";

    $: formattedTime = currentTime.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    // State for current time
    let currentTime = new Date();

    // Update time every second
    onMount(() => {
        const interval = setInterval(() => {
            currentTime = new Date();
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    });
</script>

<span class="font-bold text-[18px]">{formattedTime}</span>
