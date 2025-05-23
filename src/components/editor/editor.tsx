import { ChartParams, Page, usePage } from "../../providers/page";
import { usePlayback } from "../../providers/playback";
import Background from "../background";
import { useEffect, useRef, useState } from "react";
import Inspector from "./inspector";
import Timing from "./timing";
import Details from "./details";
import { MuseEvent, readChartFile } from "../../providers/game-manager";

enum Tab { NOTES, TIMING, DETAILS };

const MS_PER_SCROLL = 3;

export default function Editor() {
    const [[_, params], setPageParams] = usePage();
    const { audio, chart, bpm: savedBPM, measure_size: savedMeasureSize, snaps_per_beat: savedSnaps } = params as ChartParams;
    
    const [tab, setTab] = useState(Tab.TIMING);
    
    const aud = usePlayback();
    
    useEffect(() => aud.loadAudio(audio), [audio]);
    const [position, setPositionInner] = useState(0);
    function setPosition(setter: (prev: number) => number) {
        setPositionInner(prev => {
            aud.seek(setter(prev));
            return aud.getPosition();
        });
    }
    useEffect(() => {
        if (!aud.playing) return;
        
        const update = () => setPositionInner(aud.getPosition());
        const intervalId = setInterval(update, 0);
        return () => { clearInterval(intervalId); }
    }, [aud.playing]);
    
    const [bpm, setBPM] = useState<number | null>(savedBPM ?? null);
    const [offset, setOffset] = useState<number | null>(null);
    const [measureSize, setMeasureSize] = useState<number | null>(savedMeasureSize ?? null);
    const [snaps, setSnaps] = useState<number>(savedSnaps);
    const eventsRef = useRef<MuseEvent[]>([]);
    useEffect(() => {
        readChartFile(chart).then(events => {
            const offset = events.length == 0? null : events[0][0];
            setOffset(offset);
            
            eventsRef.current = events;
            if (offset != null) {
                for (const event of eventsRef.current) {
                    event[0] -= offset;
                }
            }
        });
    }, [chart]);
    
    // controls
    useEffect(() => {
        function onScroll(e: WheelEvent) {
            setPosition(prev => prev + e.deltaY * MS_PER_SCROLL);
        }
        window.addEventListener("wheel", onScroll);
        
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === " ")              
                aud.togglePlaying()
            else if (e.key === "ArrowLeft") {
                setPosition(ms => {
                    if (offset == null || bpm == null) return ms;
                    if (ms <= offset) return 0;
                    
                    const MS_PER_BEAT = 60 / bpm * 1000;
                    const beat = (ms - offset) / MS_PER_BEAT;
                    if (beat % 1 < 0.01 || 1 - (beat % 1) < 0.01) 
                        return Math.round(beat - 1) * MS_PER_BEAT + offset;
                    
                    return Math.floor(beat) * MS_PER_BEAT + offset;
                });
            }
            else if (e.key === "ArrowRight") {
                setPosition(ms => {
                    if (offset == null || bpm == null) return ms;
                    if (ms < offset) return offset;
                    
                    const MS_PER_BEAT = 60 / bpm * 1000;
                    const beat = (ms - offset) / MS_PER_BEAT;
                    if (beat % 1 < 0.01 || 1 - (beat % 1) < 0.01) 
                        return Math.round(beat + 1) * MS_PER_BEAT + offset;
                    
                    return Math.ceil(beat) * MS_PER_BEAT + offset;
                });
            }
            else if (e.key === ",")
                setPosition(prev => prev - 1);
            else if (e.key === ".")
                setPosition(prev => prev + 1);
        }
        window.addEventListener("keydown", onKeyDown);
        
        return () => { 
            window.removeEventListener("wheel", onScroll); 
            window.removeEventListener("keydown", onKeyDown); 
        }
    }, [bpm, offset]);
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
                    
                    <Inspector 
                        bpm={bpm} 
                        offset={offset} 
                        measureSize={measureSize}
                        snaps={snaps}
                        position={position} 
                        duration={aud.duration} 
                    />
                </div>
                
                {/* { tab == Tab.NOTES && <Notes />} */}
                { tab == Tab.TIMING && 
                    <Timing 
                        bpm={bpm} 
                        offset={offset} 
                        measureSize={measureSize}
                        snaps={snaps}
                        setBPM={setBPM} 
                        setOffset={setOffset} 
                        setMeasureSize={setMeasureSize}
                        setSnaps={setSnaps}
                    />
                }
                { tab == Tab.DETAILS && <Details />}
                
                {/* bottom row */}
                <div className="absolute bottom-0 left-0 right-0 flex gap-2 items-center">
                    
                    <div className="min-w-20 max-w-20">
                        <MuseButton onClick={() => aud.togglePlaying()}> 
                            {aud.playing? "pause" : "play"} 
                        </MuseButton>
                    </div>
                    
                    <p className="text-xs"> {timeDisplay(position)} </p>
                    
                    <SeekBar 
                        position={position} 
                        duration={aud.duration}  
                        onClick={pos => setPosition(() => pos)}
                    />
                </div>
                
            </div>
        </>
    );
}

export function roundUp(n: number, size: number) {
    return Math.ceil(n / size) * size;
}
export function roundDown(n: number, size: number) {
    return Math.floor(n / size) * size;
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