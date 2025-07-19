import { exit } from '@tauri-apps/plugin-process';
import { Page, usePage } from "../../contexts/page";
import MuseButton from '../../components/muse-button';
import { useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { USERDATA_DIR } from '../../lib/lib';


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
        <div className="
            fixed left-[7vw] top-[5vh]
            flex flex-col justify-center items-start gap-[2vh]
            text-[5vh] font-serif tracking-widest text-ctp-blue
        ">
            
            <img src={convertFileSrc(USERDATA_DIR + "\\logo.png")} className='w-[60vw]' />
            
            <MuseButton className="ml-[4vh] mt-[5vh]" onClick={() => setPageParams([Page.CHART_SELECT])}> song select </MuseButton>
            <MuseButton className="ml-[2vh]" onClick={() => setPageParams([Page.SETTINGS])}> settings </MuseButton>
            <MuseButton onClick={() => exit(0)}> quit </MuseButton>
        </div>
    );
}