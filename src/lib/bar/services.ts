import { mika, notifd } from "@mika-shell/core";
import type Notification from "./indicator/Notification.svelte";
import { writable } from "svelte/store";
export let notifyQuiet = writable(false);

export function notify(indicator: Notification) {
    let ns: notifd.Notification[] = JSON.parse(localStorage.getItem("notify-items") || "[]");
    let popup = false;
    indicator.setState(ns.length > 0 ? "notified" : "empty");

    async function add(id: number) {
        const n = await notifd.get(id);
        ns.push(n);
        localStorage.setItem("notify-items", JSON.stringify(ns));

        indicator.setState("notified");
        if (!popup) {
            popup = true;
            await mika.open("/#/notification?start=" + (ns.length - 1));
            popup = false;
        }
    }

    function remove(id: number) {
        ns = ns.filter((n) => n.id !== id);
        localStorage.setItem("notify-items", JSON.stringify(ns));
        indicator.setState(ns.length > 0 ? "notified" : "empty");
    }
    notifd.on("added", add);
    notifd.on("removed", remove);
}
