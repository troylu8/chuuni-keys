import { open } from '@tauri-apps/plugin-dialog';
import MainMenuButton from "../../components/main-menu-btn";
import MuseButton from "../../components/muse-button";
import { ChartMetadata, Page, usePage } from "../../providers/page";
import { copyFile, create, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { getChartFolder, stringifyIgnoreNull } from '../../lib/globals';
import { extname } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';

export default function EditMenu() {
    const [,setPageParams] = usePage();
    
    async function initNewChart(audioFilepath: string) {
        const metadata: ChartMetadata = {
            id: genID(),
            title: 'no title yet',
            bpm: 120,
            measure_size: 4,
            snaps: 1,
            audio_ext: await extname(audioFilepath)
        }
        const chartFolder = getChartFolder(metadata);
        await mkdir(chartFolder);
        
        await Promise.all([
            writeTextFile(chartFolder + "\\metadata.json", stringifyIgnoreNull(metadata)),
            create(chartFolder + "\\chart.txt"),
            copyFile(audioFilepath, `${chartFolder}\\audio.${metadata.audio_ext}`),
        ]);
        
        setPageParams([Page.EDITOR, { metadata, isNew: true }]);
    }
    
    async function handleUploadAudio() {
        const audioFilepath = await open({
            multiple: false,
            directory: false,
            title: "Select audio file",
            filters: [{
                name: "Audio",
                extensions: ["mp3", "aac", "ogg", "wav", "webm"]
            }]
        });
        if (audioFilepath == null) return;
        
        await initNewChart(audioFilepath);
    }
    
    const [hovering, setHovering] = useState(false); //TODO 
    
    useEffect(() => {
        const unlisten = getCurrentWindow().onDragDropEvent(e => {
            if (e.payload.type == "enter")      setHovering(true);
            else if (e.payload.type == "leave") setHovering(false);
            else if (e.payload.type == "drop")  initNewChart(e.payload.paths[0]);
        });
        
        return () => { unlisten.then(unlisten => unlisten()); }
    }, []);
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-3">
            <MainMenuButton />
            
            <MuseButton onClick={() => setPageParams([Page.CHART_SELECT, { isEditing: true }])}> edit existing chart </MuseButton>
                
            <h2 className='mt-6'> create new chart: </h2>
            <MuseButton onClick={handleUploadAudio}> upload audio file </MuseButton>
            
            <div className="
                outline-dashed outline-2 w-48 h-32 rounded-lg
                flex justify-center items-center
            ">
                <span className="text-center"> or drag audio file here </span>
            </div>
            
        </div>
    );
}

function genID() {
    const symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
    const res = [];
    for (let i = 0; i < 10; i++) {
        res.push(symbols[Math.floor(Math.random() * 64)]);
    }
    return res.join("");
}