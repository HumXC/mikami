<script lang="ts">
    import { App, Layer, Theme } from "@humxc/mikami";
    import { onMount } from "svelte";
    let apps: App.Application[] = [];
    let icons: Map<string, string> = new Map();
    const GetIcon = async (icon: string) => {
        return await Theme.LookupIcon(icon, 64);
    };
    App.List().then(async (result) => {
        apps = result.filter((app) => !(app.NoDisplay || app.Hidden));
        const icons_ = new Map();
        for (const app of apps) {
            let icon = await GetIcon(app.Icon);
            if (icon === "") {
                icon = await GetIcon("application-x-executable");
            }
            icons_.set(app.Icon, icon);
        }
        icons = icons_;
    });
    Layer.Init({
        Height: 100,
        Anchor: ["top", "right", "left"],
        Layer: "top",
        Margin: [8, 8, 0, 8],
        AutoExclusiveZoneEnable: true,
        KeyboardMode: "on-demand",
    });
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === "Escape") {
            Layer.Close();
        }
    };
    onMount(() => {
        document.addEventListener("keydown", handleKeyDown);
    });
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="bg-amber-200/30 h-full w-full overflow-auto
grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2
"
>
    {#each apps as app}
        <div
            on:click={() => {
                console.log(app);

                app.Run();
            }}
        >
            <img src={icons.get(app.Icon) || ""} class="h-16 w-16 rounded-2xl p-2 bg-gray-200/50" />
        </div>
    {/each}
</div>
