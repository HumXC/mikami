<script lang="ts">
    import Router from "svelte-spa-router";
    import routes from "./routes";
    import { Notifd, Mikami, Logger } from "@humxc/mikami";
    import { Events } from "@wailsio/runtime";
    const RegisterEventPage = (event: string, url: string) => {
        Events.On(event, async () => {
            const windows = await Mikami.GetAllWebview();
            for (const w of windows) {
                if (w.URL === url) {
                    Mikami.CloseWebview(w.ID);
                    return;
                }
            }
            Mikami.NewWindow(url);
        });
    };
    if (window.location.hash === "") {
        Notifd.Subscribe("notification", async () => {
            const url = "/#/notification/";
            const windows = await Mikami.GetAllWebview();
            for (const w of windows) {
                if (w.URL === url) return;
            }
            Mikami.NewWindow(url);
        }).catch((e) => {
            Logger.Error("Cannot subscribe to notification", "error", e.message);
        });
    }
    RegisterEventPage("screenshot", "/#/screenshot/");
    RegisterEventPage("app-launcher", "/#/app-launcher/");
</script>

<main>
    <Router {routes} />
</main>

<style>
    main {
        height: 100vh;
        width: 100vw;
        background-color: transparent;
    }
</style>
