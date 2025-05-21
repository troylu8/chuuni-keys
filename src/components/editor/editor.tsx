import { GamePaths, Page, usePage } from "../../providers/page";
import { usePlayback } from "../../providers/playback";
import Background from "../background";
import { useEffect, useRef, useState } from "react";
import Inspector from "./inspector";
import Timing from "./timing";
import Details from "./details";
import Notes from "./notes";
import { MuseEvent, readChartFile } from "../../providers/game-manager";

enum Tab { NOTES, TIMING, DETAILS };

export default function Editor() {
    const [[_, params], setPageParams] = usePage();
    const { audioPath, chartPath } = params as GamePaths;
    
    const [tab, setTab] = useState(Tab.TIMING);
    
    const aud = usePlayback();
    
    useEffect(() => aud.loadAudio(audioPath), [audioPath]);
    const [position, setPositionInner] = useState(0);
    function setPosition(pos: number) {
        setPositionInner(pos);
        aud.seek(pos);
    }
    useEffect(() => {
        if (!aud.playing) return;
        
        const update = () => setPositionInner(aud.getPosition());
        const intervalId = setInterval(update, 0);
        return () => { clearInterval(intervalId); }
    }, [aud.playing]);
    
    const [bpm, setBPM] = useState<number | null>(null);
    const [offset, setOffset] = useState<number | null>(null);
    const eventsRef = useRef<MuseEvent[]>([]);
    useEffect(() => {
        readChartFile(chartPath).then(({bpm, offset: off, events}) => {
            
            setBPM(bpm);
            setOffset(off);
            eventsRef.current = events;
        });
    }, [chartPath]);
    
    return (
        <>
            <Background />
            <div className="absolute cover m-1">
                
                {/* top row */}
                <div className="absolute top-0 left-0 right-0 flex flex-col gap-6">
                    
                    <div className="flex gap-1">
                        <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}> quit </MuseButton>
                        <MuseButton> save </MuseButton>
                        <div className="grow flex flex-row-reverse gap-1">
                            <MuseButton onClick={() => setTab(Tab.DETAILS)}> details </MuseButton>
                            <MuseButton onClick={() => setTab(Tab.TIMING)}> timing </MuseButton>
                            <MuseButton onClick={() => setTab(Tab.NOTES)}> notes </MuseButton>
                        </div>
                    </div>
                    
                    <Inspector bpm={bpm} offset={offset} position={position} duration={aud.duration} />
                </div>
                
                {/* { tab == Tab.NOTES && <Notes />} */}
                { tab == Tab.TIMING && <Timing bpm={bpm} offset={offset} setBPM={setBPM} setOffset={setOffset} />}
                { tab == Tab.DETAILS && <Details />}
                
                {/* bottom row */}
                <div className="absolute bottom-0 left-0 right-0 flex gap-2 items-center">
                    
                    <div className="min-w-20 max-w-20">
                        <MuseButton onClick={() => aud.setPlaying(!aud.playing)}> 
                            {aud.playing? "pause" : "play"} 
                        </MuseButton>
                    </div>
                    
                    <p className="text-xs"> {timeDisplay(position)} </p>
                    
                    <SeekBar 
                        position={position} 
                        duration={aud.duration}  
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