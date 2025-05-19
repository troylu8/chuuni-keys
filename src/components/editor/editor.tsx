import { GamePaths, Page, usePage } from "../../providers/page";
import { usePlayback } from "../../providers/playback";
import Background from "../background";
import { useEffect, useRef, useState } from "react";
import Inspector from "./inspector";

export default function Editor() {
    const [[_, params], setPageParams] = usePage();
    const { audioPath, chartPath } = params as GamePaths;
    
    const aud = usePlayback();
    const [position, setPositionInner] = useState(0);
    function setPosition(pos: number) {
        setPositionInner(pos);
        aud.seek(pos);
    }
    
    
    useEffect(() => aud.loadAudio(audioPath), [audioPath]);
    
    useEffect(() => {
        if (!aud.playing) return;
        
        const intervalId = setInterval(update, 0)
        
        function update() {
            setPositionInner(aud.getPosition());
        }
        
        return () => { clearInterval(intervalId); }
    }, [aud.playing]);
    
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
                    <div className="min-w-20 max-w-20">
                        <MuseButton onClick={() => aud.setPlaying(!aud.playing)}> 
                            {aud.playing? "pause" : "play"} 
                        </MuseButton>
                    </div>
                    
                    <p className="text-xs"> {timeDisplay(position)} </p>
                    
                    <SeekBar 
                        position={position} 
                        duration={aud.getDuration()}  
                        onClick={setPosition}
                    />
                </div>
                
                
                
            </div>
        </>
    );
}

function timeDisplay(ms: number) {
    ms = Math.round(ms);
    const secs = Math.floor(ms / 1000);
    return (
        Math.floor(secs / 60) + ":" +
        (secs % 60).toString().padStart(2, "0") + ":" +
        (ms % 1000).toString().padStart(3, "0")
    );
}

type SeekBarProps = Readonly<{
    position: number,
    duration: number,
    onClick: (position: number) => any
}>
function SeekBar({ position, duration, onClick }: SeekBarProps) {
    
    const [cursorPos, setCursorPos] = useState<number | null>(null);
    const container = useRef<HTMLDivElement | null>(null);
    
    function handleSeek() {
        if (cursorPos) 
            onClick(cursorPos / container.current!.clientWidth * duration);
    }
    
    return (
        <div 
            ref={container}
            onClick={handleSeek}
            onMouseMove={e => setCursorPos(e.nativeEvent.offsetX)}
            onMouseLeave={() => setCursorPos(null)}
            className="relative w-full flex items-center grow self-stretch bg-red [&>*]:pointer-events-none"
        >
            <div className="bg-foreground w-full h-[3px] rounded-full"></div>
            
            <div style={{left: (position / duration * 100) + "%"}} className="seek-bar-tick bg-foreground"></div>
            
            { cursorPos != null &&
                <div style={{left: cursorPos}} className="seek-bar-tick bg-foreground opacity-50"></div>
            }
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