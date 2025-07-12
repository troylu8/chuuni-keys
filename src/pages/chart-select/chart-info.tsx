import { Image, Keyboard, Music } from "lucide-react";
import Background from "../../components/background";
import { ChartMetadata, getChartFolder } from "../../lib/lib";


type Props = Readonly<{
    metadata: ChartMetadata | null
}>
export default function ChartInfo({ metadata }: Props) {

    return (
        <div className="absolute left-1/5 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 w-[60vh] h-[60vh]">
            { metadata &&
                <>
                    <div className="absolute cover overflow-hidden rounded-[15%]">
                        <Background
                            brightness={100}
                            imgPath={metadata.img_ext && `${getChartFolder(metadata)}\\img.${metadata.img_ext}`} 
                        />
                    </div>
                    <p 
                    style={{
                        borderBottom: "solid 3px var(--color-ctp-mauve)",
                    }}
                    className="
                        absolute -left-5 top-3 px-5 rounded-md
                        text-[6vh] wrap-anywhere overflow-y-hidden text-ctp-mauve bg-ctp-crust
                    "> {metadata.title} </p>
                    
                    <div 
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr) fit-content(100%)",
                        }}
                        className='
                            absolute -left-4 bottom-6 -right-4
                            text-ctp-base [&_p]:rounded-sm [&_p]:py-0.5 [&_p]:px-3 items-end gap-3
                        '
                    >
                        
                        {/* credits */}
                        <div className="
                            flex flex-col gap-1 items-start [&>p]:max-w-full
                            [&>p]:text-ellipsis [&>p]:text-nowrap [&>p]:overflow-hidden
                        ">
                            { metadata.credit_audio &&
                                <p className="bg-ctp-blue"> <Music /> &nbsp; { metadata.credit_audio } </p>
                            }
                            { metadata.credit_img &&
                                <p className="bg-ctp-green"> <Image /> &nbsp; { metadata.credit_img } </p>
                            }
                            { metadata.credit_chart &&
                                <p className="bg-ctp-text"> <Keyboard /> &nbsp; { metadata.credit_chart } </p>
                            }
                        </div>
                        
                        {/* bpm and difficulty */}
                        <div className='
                            flex flex-col gap-1 text-center items-end text-nowrap
                        '>
                            <p style={{backgroundColor: `var(--${metadata.difficulty})`}}> {metadata.difficulty} </p>
                            <p className="bg-ctp-mauve"> BPM {metadata.bpm} </p>
                        </div>
                    </div>
                </>
            }
        </div>
    );
}