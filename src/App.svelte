<script lang="ts">
    import Router from "svelte-spa-router";
    import routes from "./routes";
    import { Notifd, Mikami } from "@humxc/mikami";
    import { Events } from "@wailsio/runtime";
    if (window.location.hash === "") {
        Notifd.Subscribe("notification", async () => {
            const url = "/#/notification/";
            const windows = await Mikami.GetAllWebview();
            for (const w of windows) {
                if (w.URL === url) return;
            }
            Mikami.NewWindow(url);
        });
    }
    Events.On("screenshot", async () => {
        const url = "/#/screenshot/";
        const windows = await Mikami.GetAllWebview();
        for (const w of windows) {
            if (w.URL === url) {
                Mikami.CloseWebview(w.ID);
                return;
            }
        }
        Mikami.NewWindow(url);
    });
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
