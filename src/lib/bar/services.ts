import { mika, notifd } from "@mika-shell/core";
import type Notification from "./indicator/Notification.svelte";
import { writable } from "svelte/store";
export let notifyQuiet = writable(false);

export function notify(indicator: Notification) {
    let ns: notifd.Notification[] = JSON.parse(localStorage.getItem("notify-items") || "[]");
    let popup = 0;
    indicator.setState(ns.length > 0 ? "notified" : "empty");
    function onPopupClose(id: number) {
        if (popup !== id) return;
        popup = 0;
    }
    async function add(id: number) {
        const n = await notifd.get(id);
        ns.push(n);
        localStorage.setItem("notify-items", JSON.stringify(ns));
        if (popup === 0) {
            popup = await mika.open("/#/notification?start=" + (ns.length - 1));
        }
        indicator.setState("notified");
    }

    function remove(id: number) {
        ns = ns.filter((n) => n.id !== id);
        localStorage.setItem("notify-items", JSON.stringify(ns));
        indicator.setState(ns.length > 0 ? "notified" : "empty");
    }
    notifd.on("added", add);
    notifd.on("removed", remove);
    mika.on("close", onPopupClose);
}
