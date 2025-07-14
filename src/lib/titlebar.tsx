import { useEffect } from "react";
import { getCurrentWindow } from '@tauri-apps/api/window';



const titlebarElem = document.getElementById("titlebar")!;
const titlebarTextElem = document.getElementById("titlebar-text")!;

// add functionality to titlebar buttons
const appWindow = getCurrentWindow();
document.getElementById('titlebar-minimize')?.addEventListener('click', () => appWindow.minimize());
document.getElementById('titlebar-toggle-maximize')?.addEventListener('click', () => appWindow.toggleMaximize());
document.getElementById('titlebar-close')?.addEventListener('click', () => appWindow.close());

// prevent focus on titlebar buttons
for (const btn of titlebarElem.querySelectorAll("button")) {
    btn.addEventListener("click", () => btn.blur());
}


function setTitlebarText(text: string) {
    titlebarTextElem.textContent = text;
}
function resetTitlebarText() {
    setTitlebarText("chuuni keys");
}


export function useTitlebarText(text: string) {
    useEffect(() => {
        setTitlebarText("chuuni keys // " + text);
        return () => resetTitlebarText();
    }, [text]);
}

export function setTitlebarVisible(visible: boolean) {
    titlebarElem.style.height = visible ? "auto" : "0";
}