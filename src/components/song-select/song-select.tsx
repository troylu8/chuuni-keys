import filenamify from 'filenamify';
import { ChartParams, Page, usePage } from "../../providers/page";
import { ChartMetadata, useUserData } from "../../providers/user-data";



export default function SongSelect() {
    
    const userdata = useUserData();
    const [[_, editing], setPageParams] = usePage();
    
    if (userdata == null) return <p> loading... </p>;
    
    const {base_dir, charts} = userdata;
    
    function toChartParams(metadata: ChartMetadata): ChartParams {
        const songFolder = `${base_dir}\\charts\\${metadata.id} ${filenamify(metadata.title, {replacement: '_'})}\\`;
        metadata.chart = songFolder + metadata.chart;
        metadata.audio = songFolder + metadata.audio;
        metadata.img = metadata.img && songFolder + metadata.img;
        (metadata as ChartParams).leaderboard = songFolder + "leaderboard.csv";
        return metadata as ChartParams;
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