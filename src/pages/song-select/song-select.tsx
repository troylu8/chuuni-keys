import filenamify from 'filenamify';
import { ChartMetadata, Page, SongSelectParams, usePage } from "../../providers/page";
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { appLocalDataDir } from '@tauri-apps/api/path';



export default function SongSelect() {
    
    const [charts, setCharts] = useState<ChartMetadata[] | null>(null);
    const [[_, params], setPageParams] = usePage();
    const { isEditing } = params as SongSelectParams;
    
    useEffect(() => {
        invoke<ChartMetadata[]>("get_all_charts").then(setCharts);
    }, []);
    
    
    if (charts == null) return <p> loading... </p>;
    
    return (
        
        <div className="fixed cover">
            <div className="flex flex-row-reverse gap-3">
                <button> settings </button>
                <button onClick={() => setPageParams([Page.MAIN_MENU])}> main menu </button>
            </div>
            
            <div className="
                absolute left-0 top-0 bottom-0 flex flex-col
                overflow-auto
            ">
                
                { charts.map(metadata => 
                    <ChartEntry 
                        key={metadata.id}
                        metadata={metadata}
                        onClick={async () => {
                            const applocaldata = await appLocalDataDir();
                            
                            setPageParams([
                                isEditing? Page.EDITOR : Page.GAME, 
                                {
                                    ...metadata, 
                                    song_folder: `${applocaldata}\\userdata\\charts\\${metadata.id} ${filenamify(metadata.title, {replacement: '_'})}\\`
                                }
                            ])
                        }}
                    />
                )}
            </div>
        </div>
    );
}

type Props = Readonly<{
    metadata: ChartMetadata
    onClick: () => void
}>
function ChartEntry({ metadata, onClick }: Props) {
    return (
        <div 
            onClick={onClick}
            className="cursor-pointer"
        >
            <p>{metadata.title}</p>
            <p>{`${metadata.artists} ++ ${metadata.chart_author}`}</p>
        </div>
    )
}