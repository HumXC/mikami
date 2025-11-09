import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import "@mika-shell/component";
import "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/dark.css";

const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;
