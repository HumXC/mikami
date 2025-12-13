<script lang="ts">
    import { BellIcon, BellDotIcon, BellOffIcon } from "lucide-svelte";
    import { NotificationService, notifyQuiet } from "../services";
    import { mika, monitor } from "@mika-shell/core";
    export let size = 20;
    let state: "empty" | "notified" = "empty";
    let quite = false;

    export function setState(newState: "empty" | "notified") {
        state = newState;
    }
    const service = new NotificationService();
    service.onDNDChanged = (value) => {
        quite = value;
    };
    service.onStateChanged = (newState) => {
        state = newState;
    };
    let sidePanel = false;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    oncontextmenu={(e) => {
        e.preventDefault();
        service.doNotDisturb = !service.doNotDisturb;
    }}
    onclick={async () => {
        if (sidePanel) return;
        sidePanel = true;
        const m = await monitor.getCurrent();

        await mika.open(`/#/side-panel?parent=${mikaShell.id}&width=${m.width}&height=${m.height}`);
        sidePanel = false;
    }}
>
    {#if quite}
        <BellOffIcon {size} />
    {:else if state === "notified"}
        <BellDotIcon {size} />
    {:else if state === "empty"}
        <BellIcon {size} />
    {/if}
</div>
