import { open } from '@tauri-apps/plugin-dialog';
import { Page, usePage } from "../../contexts/page";
import { copyFile, create, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { appWindow, ChartMetadata, genRandStr, getChartFolder, stringifyIgnoreNull } from '../../lib/lib';
import { downloadDir, extname } from '@tauri-apps/api/path';
import { useEffect, useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import MuseButton from '../../components/muse-button';
import NowPlaying from '../../components/now-playing';

const VALID_AUDIO_EXTS = ["mp3", "wav", "aac", "ogg", "webm"];

export default function NewChart() {
    const [,setPageParams] = usePage();
    
    const [errMsg, setErrMsg] = useState<string | null>(null);
    
    async function initNewChart(audioFilepath: string) {
        const audio_ext = await extname(audioFilepath);
        
        if (!VALID_AUDIO_EXTS.includes(audio_ext)) {
            setErrMsg(`[ ${audio_ext} ] is not a supported file type: ( ${VALID_AUDIO_EXTS} )`);
            return;
        }
        
        const metadata: ChartMetadata = {
            id: genRandStr(),
            title: 'no title yet',
            bpm: 120,
            difficulty: "easy",
            first_beat: 0,
            preview_time: 0,
            measure_size: 4,
            snaps: 1,
            audio_ext
        }
        const chartFolder = getChartFolder(metadata);
        await mkdir(chartFolder);
        
        const [, chartFileHandle] = await Promise.all([
            writeTextFile(chartFolder + "\\metadata.json", stringifyIgnoreNull(metadata)),
            create(chartFolder + "\\chart.txt"),
            copyFile(audioFilepath, `${chartFolder}\\audio.${metadata.audio_ext}`),
        ]);
        await chartFileHandle.close();
        
        setPageParams([Page.EDITOR, { metadata, isNew: true }]);
    }
    
    async function handleUploadAudio() {
        const audioFilepath = await open({
            multiple: false,
            directory: false,
            title: "Select audio file",
            filters: [{
                name: "Audio",
                extensions: VALID_AUDIO_EXTS
            }],
            defaultPath: await downloadDir()
        });
        if (audioFilepath == null) return;
        
        await initNewChart(audioFilepath);
    }
    
    const [ hovering, setHovering ] = useState(false);
    
    useEffect(() => {
        const unlisten = appWindow.onDragDropEvent(e => {
            if (e.payload.type == "enter")      setHovering(true);
            else if (e.payload.type == "leave") setHovering(false);
            else if (e.payload.type == "drop")  {
                initNewChart(e.payload.paths[0]);
                setHovering(false);
            }
        });
        
        return () => { unlisten.then(unlisten => unlisten()); }
    }, []);
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-3">
            <NowPlaying />
            
            <div className="absolute top-1 left-1 z-10 flex gap-3">
                <MuseButton onClick={() => setPageParams([Page.CHART_SELECT])}>
                    <ArrowLeft /> back
                </MuseButton>
            </div>
            
            <h1 className='text-[6vh] '> create new chart </h1>
            <div 
                onClick={handleUploadAudio}
                className={`
                    ${hovering && "text-ctp-blue"}
                    outline-dashed outline-2 w-64 h-42 rounded-lg
                    flex flex-col gap-3 justify-center items-center cursor-pointer
                `}
            >
                <Upload size="20%" />
                <p> click to upload audio </p>
                <p> or drop audio file here </p>
            </div>
            
            <p className='text-ctp-red font-mono'> { errMsg } </p>
        </div>
    );
}

