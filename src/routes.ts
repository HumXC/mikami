import Bar from "./lib/bar/Bar.svelte";
import Notification from "./lib/notification/Notification.svelte";
import Screenshot from "./lib/screenshot/Screenshot.svelte";
export default {
    "/": Bar,
    "/notification": Notification,
    "/screenshot": Screenshot,
};
