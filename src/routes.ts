import AppLauncher from "./lib/app-launcher/AppLauncher.svelte";
import Bar from "./lib/bar/Bar.svelte";
import Clipboard from "./lib/clipboard/Clipboard.svelte";
import Notification from "./lib/notification/Notification.svelte";
import Screenshot from "./lib/screenshot/Screenshot.svelte";
import Workspace from "./lib/workspace/Workspace.svelte";
export default {
    "/bar": Bar,
    "/notification": Notification,
    "/screenshot": Screenshot,
    "/app-launcher": AppLauncher,
    "/workspace": Workspace,
    "/clipboard": Clipboard,
};
