import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { Events } from "@wailsio/runtime";
import { Logger, Mikami, Notifd } from "@humxc/mikami";

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
    RegisterEventPage("screenshot", "/#/screenshot/");
    RegisterEventPage("app-launcher", "/#/app-launcher/");
}

const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;
