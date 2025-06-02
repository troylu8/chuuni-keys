import filenamify from 'filenamify';
import { ChartParams, Page, usePage } from "../../providers/page";
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export type ChartMetadata = {
    id: string,
    title: string,
    artists: string,
    chart_author: string,
    bpm?: number,
    measure_size?: number,
    snaps_per_beat: number,
    audio: string,
    chart: string,
    img?: string
}

export default function SongSelect() {
    
    const [charts, setCharts] = useState<ChartMetadata[] | null>(null);
    const [[_, editing], setPageParams] = usePage();
    
    useEffect(() => {
        invoke<ChartMetadata[]>("get_all_charts").then(setCharts);
    }, []);
    
    
    if (charts == null) return <p> loading... </p>;
    
    
    function toChartParams(metadata: ChartMetadata): ChartParams {
        const params = {...metadata} as ChartParams;
        const songFolder = `charts\\${params.id} ${filenamify(params.title, {replacement: '_'})}\\`;
        params.chart = songFolder + params.chart;
        params.audio = songFolder + params.audio;
        params.img = params.img && songFolder + params.img;
        params.leaderboard = songFolder + "leaderboard.csv";
        return params;
    }

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
                        onClick={() => {
                            setPageParams([
                                editing === true? Page.EDITOR : Page.GAME, 
                                toChartParams(metadata)
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