<script lang="ts">
    import { onMount, tick } from "svelte";

    const channel = new BroadcastChannel("wf-recorder");
    let recording = false;
    let box: HTMLDivElement;
    channel.onmessage = async (event) => {
        if (event.data.state === undefined) return;
        recording = event.data.state === "recording";
        if (recording) {
            box.style.display = "flex";
            await tick();
            box.style.opacity = "1";
        } else {
            box.style.opacity = "0";
            setTimeout(() => {
                box.style.display = "none";
            }, 300);
        }
    };
    channel.postMessage("request-state");

    onMount(() => {
        box.style.display = "none";
    });
</script>

<div
    bind:this={box}
    class="outer rounded-full flex justify-center items-center transition-opacity duration-300 ease-in-out"
>
    <div class="inner animate-pulse rounded-full"></div>
</div>

<style>
    .outer {
        border: 1px solid #ffffffcd;
        background-color: #3e3e3e48;
        height: 18px;
        width: 18px;
    }
    .inner {
        background-color: #ff0b0bd3;
        height: 8px;
        width: 8px;
    }
</style>
