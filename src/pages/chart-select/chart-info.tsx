import Background from "../../components/background";
import { getChartFolder } from "../../lib/globals";
import { ChartMetadata } from "../../providers/page";

type Props = Readonly<{
    metadata: ChartMetadata | null
    onClick: () => any
}>
export default function ChartInfo({ metadata, onClick }: Props) {

    return (
        <div 
            onClick={onClick}
            className="
                absolute left-1/5 -translate-x-1/2 top-1/4 w-[50vh] h-[50vh] max-w-full
                flex flex-col justify-between p-3
                bg-color1 rounded-[15%]
            "
        >
            { metadata && 
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
        </div>
    );
}