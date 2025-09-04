<script lang="ts">
    import { BellIcon, BellDotIcon, BellOffIcon } from "lucide-svelte";
    import { notifyQuiet } from "../services";
    export let size = 20;
    let state: "empty" | "notified" = "empty";
    let quite = false;
    notifyQuiet.subscribe((value) => (quite = value));

    export function setState(newState: "empty" | "notified") {
        state = newState;
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    oncontextmenu={(e) => {
        e.preventDefault();
        notifyQuiet.set(!quite);
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
