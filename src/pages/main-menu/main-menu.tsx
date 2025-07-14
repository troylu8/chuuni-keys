import { exit } from '@tauri-apps/plugin-process';
import { Page, usePage } from "../../contexts/page";
import MuseButton from '../../components/muse-button';
import { useEffect } from 'react';


export default function MainMenu() {
    const [,setPageParams] = usePage();
    
    // keybinds
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key == "Enter") setPageParams([Page.CHART_SELECT]);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => { window.removeEventListener("keydown", handleKeyDown); }
    }, []);
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-3 bg-ctp-base">
            <MuseButton onClick={() => setPageParams([Page.CHART_SELECT])}> song select </MuseButton>
            <MuseButton onClick={() => setPageParams([Page.SETTINGS])}> settings </MuseButton>
            <MuseButton onClick={() => exit(0)}> quit </MuseButton>
        </div>
    );
}