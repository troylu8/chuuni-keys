import { open } from '@tauri-apps/plugin-dialog';
import MainMenuButton from "../../components/main-menu-btn";
import MuseButton from "../../components/muse-button";
import { ChartMetadata, Page, usePage } from "../../contexts/page";
import { copyFile, create, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { getChartFolder, stringifyIgnoreNull } from '../../lib/globals';
import { extname } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';

export default function EditMenu() {
    const [,setPageParams] = usePage();
    
    async function initNewChart(audioFilepath: string) {
        const metadata: ChartMetadata = {
            id: genID(),
            title: 'no title yet',
            bpm: 120,
            first_beat: 0,
            preview_time: 0,
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
            <div 
                onClick={handleUploadAudio}
                className="
                    outline-dashed outline-2 w-64 h-42 rounded-lg
                    flex flex-col gap-3 justify-center items-center
                "
            >
                <Upload size="20%" />
                <p> click to upload </p>
                <p> or drop audio file here </p>
            </div>
            
        </div>
    );
}

function genID() {
    const symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
    const res = [];
    for (let i = 0; i < 10; i++) {
        res.push(symbols[Math.floor(Math.random() * 64)]);
    }
    return res.join("");
}