import { Image, Keyboard, Music } from "lucide-react";
import Background from "../../components/background";
import { ChartMetadata, getChartFolder, resetAnimation } from "../../lib/lib";
import { useEffect, useRef } from "react";
import { useOnBeat } from "../../lib/sound";


type Props = Readonly<{
    metadata: ChartMetadata | null
}>
export default function ChartInfo({ metadata }: Props) {
    
    const creditsCont = useRef<HTMLDivElement | null>(null);
    const infoCont = useRef<HTMLDivElement | null>(null); // bpm, difficulty
    
    const beatDuration = useOnBeat(beat => {
        const credits = creditsCont.current;
        const info = infoCont.current;
        if (!credits || !info) return;
        
        const totalHeight = Math.max(credits.children.length, info.children.length);
        const currCredit = credits.children[credits.children.length - totalHeight + beat % totalHeight];
        const currInfo = info.children[info.children.length - totalHeight + beat % totalHeight];
        
        if (currCredit) resetAnimation(currCredit as HTMLElement);
        if (currInfo) resetAnimation(currInfo as HTMLElement);
    });
    
    const animationDuration = beatDuration ? beatDuration + "ms" : "";
    
    const infoFrameRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (infoFrameRef.current)
            resetAnimation(infoFrameRef.current);
    }, [metadata?.id]);
    
    return (
        <div className="absolute left-1/5 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 w-[60vh] h-[60vh]">
            { metadata &&
                <>
                    <div 
                        ref={infoFrameRef}
                        className="
                            absolute -top-2 -bottom-2 -left-2 -right-2
                            rounded-[15%] anim-info-frame -z-10
                        "
                    ></div>
                    
                    <div className="absolute cover overflow-hidden rounded-[15%] outline-[1vh] outline-ctp-base">
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
                            absolute -left-5 top-3 px-5 rounded-md font-serif
                            text-[6vh] wrap-anywhere overflow-y-hidden text-ctp-mauve bg-ctp-crust
                        "
                    > {metadata.title} </p>
                    
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
                        <div 
                            ref={creditsCont}
                            className="
                                flex flex-col gap-1 items-start [&>p]:max-w-full
                                [&>p]:text-ellipsis [&>p]:text-nowrap [&>p]:overflow-hidden
                            "
                        >
                            { metadata.credit_audio &&
                                <p style={{animationDuration}} className="anim-flash-light bg-ctp-blue"> <Music /> &nbsp; { metadata.credit_audio } </p>
                            }
                            { metadata.credit_img &&
                                <p style={{animationDuration}} className="anim-flash-light  bg-ctp-green"> <Image /> &nbsp; { metadata.credit_img } </p>
                            }
                            { metadata.credit_chart &&
                                <p style={{animationDuration}} className="anim-flash-light  bg-ctp-text"> <Keyboard /> &nbsp; { metadata.credit_chart } </p>
                            }
                        </div>
                        
                        {/* bpm and difficulty */}
                        <div 
                            ref={infoCont}
                            className='flex flex-col gap-1 text-center items-end text-nowrap'
                        >
                            <p style={{animationDuration, backgroundColor: `var(--${metadata.difficulty})`}} className="anim-flash"> {metadata.difficulty} </p>
                            <p style={{animationDuration}} className="anim-flash-light bg-ctp-mauve"> BPM {metadata.bpm} </p>
                        </div>
                    </div>
                </>
            }
        </div>
    );
}