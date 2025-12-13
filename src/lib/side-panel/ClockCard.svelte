<script lang="ts">
    import { onMount } from "svelte";

    $: formattedTime = currentTime.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    let currentTime = new Date();

    onMount(() => {
        const interval = setInterval(() => {
            currentTime = new Date();
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    });

    function getDate() {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return `${year} 年 ${month} 月 ${day} 日 星期${["日", "一", "二", "三", "四", "五", "六"][date.getDay()]}`;
    }
</script>

<div class="flex flex-col rounded-sm p-4 bg-[var(--bg2)] mr-4">
    <div>
        <span class="text-8xl">{formattedTime.split(":")[0]}</span>
        <span class="text-5xl">: {formattedTime.split(":")[1]}</span>
    </div>
    <br />
    <span class="text-lg ml-2">{getDate()}</span>
</div>
