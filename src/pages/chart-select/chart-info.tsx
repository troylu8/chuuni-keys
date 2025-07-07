import Background from "../../components/background";
import { getChartFolder } from "../../lib/globals";
import { ChartMetadata } from "../../contexts/page";
import { useState } from "react";
import MuseButton from "../../components/muse-button";

const CLICKS_TO_DELETE = 3;

type Props = Readonly<{
    metadata: ChartMetadata | null
    deleteActiveChart: () => any
}>
export default function ChartInfo({ metadata, deleteActiveChart }: Props) {
    
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteClicks, setDeleteClicks] = useState(0);
    
    function handleDeleteClicked() {
        if (deleteClicks + 1 === CLICKS_TO_DELETE) 
            deleteActiveChart();
        else 
            setDeleteClicks(deleteClicks + 1);
    }

    return (
        <div 
            onContextMenu={() => setMenuOpen(!menuOpen)}
            className="
                absolute left-1/5 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10
                w-[60vh] h-[60vh] max-w-full
                flex flex-col justify-between p-3
                bg-color1 rounded-[15%] overflow-hidden text-background
            "
        >
            { metadata && !menuOpen &&
                <>
                    <Background imgPath={`${getChartFolder(metadata)}\\img.${metadata.img_ext}`} />
                    <p className="text-[6vh] wrap-anywhere overflow-y-hidden"> {metadata.title} </p>
                    
                    <div className='flex justify-between gap-3'>
                        
                        {/* credits grid */}
                        <div 
                            style={{
                                display: "grid",
                                gridTemplateColumns: "fit-content(100%) 1fr",
                                columnGap: "12px"
                            }}
                            className='[&>p]:text-ellipsis [&>p]:text-nowrap [&>p]:overflow-hidden'
                        >
                            { metadata.credit_audio &&
                                <>
                                    <p className="text-end"> music </p>
                                    <p> { metadata.credit_audio } </p>
                                </>
                            }
                            { metadata.credit_img &&
                                <>
                                    <p className="text-end"> img </p>
                                    <p> { metadata.credit_img } </p>
                                </>
                            }
                            { metadata.credit_chart &&
                                <>
                                    <p className="text-end"> chart </p>
                                    <p> { metadata.credit_chart } </p>
                                </>
                            }
                        </div>
                        
                        {/* bpm and difficulty */}
                        <div className='flex flex-col-reverse'>
                            <p>bpm</p>
                            <p>diff</p>
                        </div>
                    </div>
                </>
            }
            
            { metadata && menuOpen &&
                <>
                    <MuseButton> edit </MuseButton>
                    <MuseButton onClick={handleDeleteClicked}> 
                        { deleteClicks == 0? "delete map" : `click again to delete: ${deleteClicks} / ${CLICKS_TO_DELETE}` } 
                    </MuseButton>
                </>
            }
        </div>
    );
}