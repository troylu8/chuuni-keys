import { ChartParams, Page, usePage } from "../../providers/page";
import { usePlayback } from "../../providers/playback";
import Background from "../../components/background";
import { useEffect, useRef, useState } from "react";
import Inspector from "./inspector";
import Timing from "./timing";
import Details from "./details";
import { MuseEvent, readChartFile } from "../../providers/game-manager";
import createTree, { Tree } from "functional-red-black-tree";
import Notes from "./notes";

enum Tab { NOTES, TIMING, DETAILS };



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
    
    const [events, setEvents] = useState<Tree<number, MuseEvent> | null>(null);
    useEffect(() => {
        readChartFile(chart).then(events => {
            console.log("chart", chart);
            let tree = createTree<number, MuseEvent>((a, b) => a - b);
            
            const offset = events.length == 0? null : events[0][0];
            setOffset(offset);
            
            for (const event of events) {
                tree = tree.insert(event[0], event);
            }
            
            setEvents(tree);
        });
        
    }, [chart]);
    
    
    useEffect(() => {
        function onScroll(e: WheelEvent) {
            if (offset == null || bpm == null) return;
            setPosition(ms => {
                aud.setPlaying(false);
                
                const MS_PER_BEAT = 60 / bpm * 1000;
                if (e.deltaY < 0) {
                    return snapLeft(ms, offset, MS_PER_BEAT / (snaps + 1));
                }
                else {
                    return snapRight(ms, offset, MS_PER_BEAT / (snaps + 1));
                }
            });
        }
        window.addEventListener("wheel", onScroll);
        
        function snapLeft(ms: number, offset: number, size: number) {
            const beat = (ms - offset) / size;
            if (beat % 1 < 0.01 || 1 - (beat % 1) < 0.01) 
                return Math.round(beat - 1) * size + offset;
            
            return Math.floor(beat) * size + offset;
        }
        function snapRight(ms: number, offset: number, size: number) {
            const beat = (ms - offset) / size;
            if (beat % 1 < 0.01 || 1 - (beat % 1) < 0.01) 
                return Math.round(beat + 1) * size + offset;
            
            return Math.ceil(beat) * size + offset;
        }
        
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === " ")              
                aud.togglePlaying()
            else if (e.key === "ArrowLeft") {
                setPosition(ms => {
                    if (offset == null || bpm == null) return ms;
                    if (ms <= offset) return 0;
                    const MS_PER_BEAT = 60 / bpm * 1000;
                    return snapLeft(ms, offset, MS_PER_BEAT);
                });
            }
            else if (e.key === "ArrowRight") {
                setPosition(ms => {
                    if (offset == null || bpm == null) return ms;
                    if (ms < offset) return offset;
                    const MS_PER_BEAT = 60 / bpm * 1000;
                    return snapRight(ms, offset, MS_PER_BEAT);
                });
            }
            else if (e.key === ",")
                setPosition(prev => prev - 1);
            else if (e.key === ".")
                setPosition(prev => prev + 1);
            else if ("qwertyuiopasdfghjklzxcvbnm,".includes(e.key)) {
                const pos = aud.getPosition();
                setEvents(prev => {
                    if (!prev) return null;
                    
                    const iter = prev.ge(pos);
                    while (iter.valid && iter.key == pos) {
                        // if this key exists at this time, remove it
                        if (iter.value![1] == ":" + e.key) {
                            return iter.remove();
                        }
                        iter.next();
                    }
                    
                    // key didnt exist at this time, so add it
                    return prev.insert(pos, [pos, ":" + e.key]);
                });
            }
        }
        window.addEventListener("keydown", onKeyDown);
        
        return () => { 
            window.removeEventListener("wheel", onScroll); 
            window.removeEventListener("keydown", onKeyDown); 
        }
    }, [bpm, offset, snaps]);
    
    return (
        <>
            <Background />
            <div className="absolute cover m-1 flex flex-col">
                
                {/* top row */}
                <nav className="flex flex-col gap-5 mb-8">
                    <div className="relative flex gap-1">
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
                        events={events}
                    />
                </nav>
                
                <div className="relative grow">
                    { tab == Tab.NOTES && events && <Notes events={events} position={position} />}
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
                </div>
                
                {/* bottom row */}
                <nav className="flex gap-2 items-center">
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
                </nav>
                
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