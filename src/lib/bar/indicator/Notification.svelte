<script lang="ts">
    import { BellIcon, BellDotIcon, BellOffIcon } from "lucide-svelte";
    import { NotificationService } from "../services";
    import { mika } from "@mika-shell/core";
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
    let sidePanel = 0;
    mika.on("close", (id: number) => {
        if (id === sidePanel) {
            sidePanel = 0;
        }
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    oncontextmenu={(e) => {
        e.preventDefault();
        service.doNotDisturb = !service.doNotDisturb;
    }}
    onclick={async () => {
        if (sidePanel !== 0) {
            const id = sidePanel;
            sidePanel = 0;
            mika.close(id);
            return;
        }
        sidePanel = await mika.openAsync("side-panel");
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
