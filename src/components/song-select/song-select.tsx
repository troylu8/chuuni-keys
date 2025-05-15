import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import filenamify from 'filenamify';
import { Page, usePage } from "../../providers/page";


type ChartMetadata = {
    id: string,
    title: string,
    artists: string,
    chart_author: string,
    audio: string,
    chart: string,
    img?: string
}
type AllChartsData = {
    charts: ChartMetadata[]
    charts_dir: string
}

export default function SongSelect() {
    
    const [allCharts, setAllCharts] = useState<AllChartsData | null>(null);
    const [_, setPageParams] = usePage();
    
    useEffect(() => {
        invoke<AllChartsData>("get_all_songs")
        .then(chartsResp => {
            console.log(chartsResp);
            setAllCharts(chartsResp);
        });
    }, []);
    
    if (allCharts == null) return <p> loading... </p>;
    
    const {charts, charts_dir} = allCharts;

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
                            const songFolder = `${charts_dir}\\${metadata.id} ${filenamify(metadata.title, {replacement: '_'})}\\`;
                            console.log(songFolder + metadata.audio);
                            setPageParams([Page.GAME, {
                                chartPath: songFolder + metadata.chart,
                                audioPath: songFolder + metadata.audio,
                                imgPath: metadata.img && songFolder + metadata.img
                            }])
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