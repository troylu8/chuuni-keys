import { GamePaths, Page, usePage } from "../../providers/page";
import { usePlayback } from "../../providers/playback";
import Background from "../background";
import { useEffect, useRef } from "react";
import Inspector from "./inspector";

export default function Editor() {
    const [[_, params], setPageParams] = usePage();
    const aud = usePlayback();
    
    const { audioPath, chartPath } = params as GamePaths;
    
    useEffect(() => {
        
        aud.loadAudio(audioPath);
        
    }, [audioPath]);
    
    return (
        <>
            <Background />
            <div className="absolute cover m-1">
                
                {/* top row buttons */}
                <div className="absolute top-0 left-0 right-0 flex flex-col gap-2">
                    <div className="flex">
                        <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}> quit </MuseButton>
                        <div className="grow flex flex-row-reverse gap-1">
                            <MuseButton> save </MuseButton>
                            <MuseButton> details </MuseButton>
                        </div>
                    </div>
                    
                    <Inspector />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 flex gap-2 items-center">
                    
                    {/* bottom inspector row */}
                    <div className="w-16">
                        <MuseButton onClick={() => aud.setPlaying(!aud.playing)}> 
                            {aud.playing? "pause" : "play"} 
                        </MuseButton>
                    </div>
                    
                    <SeekBar 
                        position={aud.getPosition()} 
                        duration={aud.getDuration()}  
                        onClick={console.log}
                    />
                </div>
                
                
                
            </div>
        </>
    );
}


type SeekBarProps = Readonly<{
    position: number,
    duration: number,
    onClick: (position: number) => any
}>
function SeekBar({ position, duration, onClick }: SeekBarProps) {
    
    function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
        onClick(e.nativeEvent.offsetX / e.currentTarget.offsetWidth * duration);
    }
    
    return (
        <div 
            onClick={handleSeek}
            className="relative w-full h-[3px] bg-foreground px-3 rounded-md"
        >
            <div className={`
                absolute h-[10px] top-1/2 -translate-y-1/2  left-[${position / duration}%] -translate-x-1/2
            `}>
            </div>
        </div>
    )
}

type Props = Readonly<{
    children: React.ReactNode
    onClick?: () => any
}>
function MuseButton({ children, onClick }: Props) {
    return (
        <button 
            onClick={onClick} 
            className="
                px-2 text-background bg-foreground rounded-md             
            "
        >
            { children }
        </button>
    )
}