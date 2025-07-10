import { open } from '@tauri-apps/plugin-dialog';
import { Page, usePage } from "../../contexts/page";
import { copyFile, create, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { ChartMetadata, genRandStr, getChartFolder, stringifyIgnoreNull } from '../../lib/lib';
import { downloadDir, extname } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import MuseButton from '../../components/muse-button';

export default function NewChart() {
    const [,setPageParams] = usePage();
    
    async function initNewChart(audioFilepath: string) {
        const metadata: ChartMetadata = {
            id: genRandStr(),
            title: 'no title yet',
            bpm: 120,
            difficulty: "easy",
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
                extensions: ["mp3", "wav", "aac", "ogg", "webm"]
            }],
            defaultPath: await downloadDir()
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
            <div className="absolute top-1 left-1 z-10 flex gap-3">
                <MuseButton onClick={() => setPageParams([Page.CHART_SELECT])}>
                    <ArrowLeft /> back
                </MuseButton>
            </div>
            
            <h1 className='mt-6'> create new chart </h1>
            <div 
                onClick={handleUploadAudio}
                className="
                    outline-dashed outline-2 w-64 h-42 rounded-lg
                    flex flex-col gap-3 justify-center items-center cursor-pointer
                "
            >
                <Upload size="20%" />
                <p> click to upload audio </p>
                <p> or drop audio file here </p>
            </div>
            
        </div>
    );
}

