<script lang="ts">
    import hotkeys from "hotkeys-js";
    import { layer, os } from "@mika-shell/core";
    import { onMount, tick } from "svelte";
    import {
        PowerIcon,
        RefreshCwIcon,
        LogOutIcon,
        RefreshCcwDotIcon,
        MoonStarIcon,
    } from "lucide-svelte";
    layer.init({
        namespace: "power-menu",
        anchor: ["top", "bottom", "left", "right"],
        layer: "overlay",
        keyboardMode: "exclusive",
        backgroundTransparent: true,
        exclusiveZone: -1,
    });
    hotkeys("esc", (e) => {
        layer.close();
    });
    onMount(async () => {
        await tick();
        document.getElementById("power-menu")!.style.opacity = "1";
    });

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
    let active = 0;
    hotkeys("tab,down,right", (e) => {
        e.stopPropagation();
        e.preventDefault();
        active = (active + 1) % actions.length;
    });
    hotkeys("shift+tab,up,left", (e) => {
        e.stopPropagation();
        e.preventDefault();
        active = (active - 1 + actions.length) % actions.length;
    });
    hotkeys("enter", (e) => {
        e.stopPropagation();
        e.preventDefault();
        os.exec(actions[active].command);
        layer.close();
    });
    const actions = [
        { label: "Logout", Icon: LogOutIcon, command: ["hyprctl", "dispatch", "exit"] },
        { label: "Shutdown", Icon: PowerIcon, command: ["systemctl", "poweroff"] },
        { label: "Reboot", Icon: RefreshCwIcon, command: ["systemctl", "reboot"] },
        {
            label: "Soft Reboot",
            Icon: RefreshCcwDotIcon,
            command: ["systemctl", "soft-reboot", "--no-wall"],
        },
        { label: "Suspend", Icon: MoonStarIcon, command: ["systemctl", "suspend"] },
    ];
</script>

<div
    id="power-menu"
    class="w-full h-full opacity-0 transition-opacity duration-300 ease-in-out flex flex-col justify-center items-center"
>
    <span class="text-9xl pt-40">{formattedTime}</span>
    <div id="buttons" class="flex flex-row justify-center items-center w-full h-full gap-10">
        {#each actions as action, i}
            <button
                data-flag={action.label}
                class:active={active === i}
                onmouseenter={() => (active = i)}
            >
                <svelte:component this={action.Icon} size={64} strokeWidth={1} />
            </button>
        {/each}
    </div>
    <span class="text-5xl pb-60">{actions[active].label}</span>
</div>

<style>
    #power-menu {
        background-color: rgba(0, 0, 0, 0.923);
        color: rgb(197, 197, 197);
    }
    button {
        width: 160px;
        height: 160px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(49, 49, 49, 0.755);
        border: none;
        border-radius: 50%;
        padding: 0;
        margin: 0;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }
    .active {
        background-color: rgba(255, 255, 255, 0.312);
    }
</style>
