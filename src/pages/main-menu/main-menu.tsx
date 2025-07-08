import { exit } from '@tauri-apps/plugin-process';
import { Page, usePage } from "../../contexts/page";


export default function MainMenu() {
    const [,setPageParams] = usePage();    
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-3">
            <button onClick={() => setPageParams([Page.CHART_SELECT])}> song select </button>
            <button onClick={() => setPageParams([Page.SETTINGS])}> settings </button>
            <button onClick={() => exit(0)}> quit </button>
        </div>
    );
}