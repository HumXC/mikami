import AppLauncher from "./lib/app-launcher/AppLauncher.svelte";
import Bar from "./lib/bar/Bar.svelte";
import Traymenu from "./lib/bar/traymenu/Traymenu.svelte";
import Clipboard from "./lib/clipboard/Clipboard.svelte";
import Desktop from "./lib/desktop/Desktop.svelte";
import Notification from "./lib/notification/Notification.svelte";
import Powermenu from "./lib/power-menu/Powermenu.svelte";
import QuickRun from "./lib/quick-run/QuickRun.svelte";
import Screenshot from "./lib/screenshot/Screenshot.svelte";
import Toolbar from "./lib/toolbar/Toolbar.svelte";
import Recorder from "./lib/wf-recorder/Recorder.svelte";
import Workspace from "./lib/workspace/Workspace.svelte";
import OCR from "./lib/ocr/OCR.svelte";
export default {
    "/bar": Bar,
    "/notification": Notification,
    "/screenshot": Screenshot,
    "/app-launcher": AppLauncher,
    "/workspace": Workspace,
    "/clipboard": Clipboard,
    "/wf-recorder": Recorder,
    "/power-menu": Powermenu,
    "/toolbar": Toolbar,
    "/traymenu": Traymenu,
    "/quick-run": QuickRun,
    "/desktop": Desktop,
    "/ocr": OCR,
};
