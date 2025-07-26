import { useBgmState } from "./contexts/bgm-state";
import { useSettings } from "./contexts/settings";
import { Page, usePage } from "./contexts/page";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appWindow, RESOURCE_DIR } from "./lib/lib";


export default function Titlebar() {
    const [{ fullscreen }] = useSettings();
    const { title: bgmTitle, credit_audio } = useBgmState();
    const [[page]] = usePage();
    
    const showBgmTitle = (page == Page.EDITOR || page == Page.GAME) && bgmTitle;
    
    return (
        <nav id="titlebar" style={{height: fullscreen ? 0 : "fit-content"}}>
            <div id="titlebar-header" data-tauri-drag-region>
                
                {/* i swear the image quality is higher when using a 24x24 img and scaling it down to 16 over just using a 16x16 img */}
                <img src={convertFileSrc(RESOURCE_DIR + "\\icon24x24.png")} width={16} height={16} data-tauri-drag-region />
                
                <p id="titlebar-text" data-tauri-drag-region>
                    chuuni keys { showBgmTitle && ( " // " + bgmTitle + (credit_audio ? " - " + credit_audio : "") ) }
                </p>
            </div>
            <div id="titlebar-controls">
                <button 
                    onClick={e => {
                        appWindow.minimize();
                        e.currentTarget.blur();
                    }}
                    id="titlebar-minimize" 
                    className="titlebar-control" 
                    tabIndex={-1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus-icon lucide-minus"><path d="M5 12h14" /></svg>
                </button>
                <button 
                    onClick={e => {
                        appWindow.toggleMaximize();
                        e.currentTarget.blur();
                    }} 
                    id="titlebar-toggle-maximize" 
                    className="titlebar-control" 
                    tabIndex={-1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                </button>
                <button 
                    onClick={e => {
                        appWindow.close();
                        e.currentTarget.blur();
                    }} 
                    id="titlebar-close" 
                    className="titlebar-control" 
                    tabIndex={-1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>
        </nav>
    )
}