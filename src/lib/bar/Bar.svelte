<script lang="ts">
    import Time from "./Time.svelte";
    import { layer, mika } from "@mika-shell/core";
    import Recording from "./indicator/Recording.svelte";
    import * as services from "./services";
    import Notification from "./indicator/Notification.svelte";
    layer.init({
        height: 34,
        anchor: ["top", "right", "left"],
        layer: "top",
        margin: [8, 8, 0, 8],
        autoExclusiveZone: true,
        backgroundTransparent: true,
    });
    let toolbar: number | null = null;
    async function hoverOpenToolbar() {
        if (toolbar === null) {
            toolbar = 0;
            toolbar = await mika.openAsync("toolbar");
        }
    }
    mika.on("close", (id) => {
        if (id === toolbar) toolbar = null;
    });
    new services.NotificationService("/#/notification");

    let workspaceMenu: number = 0;
    mika.on("close", (id) => {
        if (id === workspaceMenu) workspaceMenu = 0;
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<mk-bar class="bar">
    <div slot="start" class=" flex flex-row pl-0.5 gap-2">
        <mk-tray class="tray" contextMenuPath="/#/traymenu" side="top"></mk-tray>

        <mk-hyprland-workspace
            class="workspace"
            oncontextmenu={(e: MouseEvent) => {
                e.preventDefault();
                if (workspaceMenu === 0) {
                    mika.openAsync("/#/workspace?side=top").then((id) => {
                        workspaceMenu = id;
                    });
                } else {
                    mika.close(workspaceMenu);
                }
            }}
        ></mk-hyprland-workspace>
    </div>

    <div slot="center-start"></div>
    <div slot="center-main" onmouseenter={hoverOpenToolbar}>
        <Time />
    </div>
    <div slot="center-end">
        <Recording />
    </div>

    <div slot="end" class="flex flex-row pr-0.5 gap-2"><Notification /></div>
</mk-bar>

<style>
    .bar {
        background-color: var(--bg);
        padding: 0 6px;
        border-radius: 50px;
    }
    .tray::part(item) {
        width: 20px;
        height: 20px;
        padding: 2px;
        background-color: #9696966b;
    }
</style>
