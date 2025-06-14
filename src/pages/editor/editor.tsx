import { GameAndEditorParams, Page, usePage } from "../../providers/page";
import { usePlayback } from "../../providers/playback";
import Background from "../../components/background";
import { useEffect, useRef, useState } from "react";
import Inspector from "./inspector";
import Timing from "./timing";
import Details from "./details";
import { MuseEvent, readChartFile } from "../../providers/game-manager";
import createTree, { Tree } from "functional-red-black-tree";
import Notes from "./notes";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import MuseButton from "../../components/muse-button";

enum Tab { NOTES, TIMING, DETAILS };

export default function Editor() {
    const [[_, params], setPageParams] = usePage();
    const { song_folder, audio: audioSrc, bpm: savedBPM, measure_size: savedMeasureSize, snaps_per_beat: savedSnaps } = params as GameAndEditorParams;
    
    const [tab, setTab] = useState(Tab.NOTES);
    
    const aud = usePlayback();
    
    useEffect(() => { aud.loadAudio(song_folder + audioSrc); }, [song_folder, audioSrc]);
    const [position, setPositionInner] = useState(0);
    function setPosition(setter: (prev: number) => number) {
        setPositionInner(prev => {
            aud.seek(setter(prev));
            return aud.getTruePosition();
        });
    }
    useEffect(() => {
        const unlisten = aud.addPosUpdateListener(offset_pos => {
            setPositionInner(offset_pos);
        });
        return unlisten;
    }, []);
    
    const [bpm, setBPM] = useState<number | null>(savedBPM ?? null);
    const MS_PER_BEAT = bpm && 60 / bpm * 1000;
    const [measureSize, setMeasureSize] = useState<number | null>(savedMeasureSize ?? null);
    const [snaps, setSnaps] = useState<number>(savedSnaps);
    
    const [events, setEvents] = useState<Tree<number, MuseEvent> | null>(null);
    const first_event_ms = events && (events.begin.value?.[0] ?? null);
    useEffect(() => {
        readChartFile(song_folder + "chart.txt").then(events => {
            let tree = createTree<number, MuseEvent>((a, b) => a - b);
            
            for (const event of events) {
                tree = tree.insert(event[0], event);
            }
            
            setEvents(tree);
        });
    }, [song_folder]);
    
    // keybinds and scroll
    useEffect(() => {
        function onScroll(e: WheelEvent) {
            if (MS_PER_BEAT == null) return;
            setPosition(ms => {
                aud.setPlaying(false);
                
                if (e.deltaY < 0) {
                    return snapLeft(ms, first_event_ms ?? 0, MS_PER_BEAT / (snaps + 1));
                }
                else {
                    return snapRight(ms, first_event_ms ?? 0, MS_PER_BEAT / (snaps + 1));
                }
            });
        }
        function snapLeft(ms: number, startingFrom: number, size: number) {
            const beat = (ms - startingFrom) / size;
            if (beat % 1 < 0.01 || 1 - (beat % 1) < 0.01) 
                return Math.round(beat - 1) * size + startingFrom;
            
            return Math.floor(beat) * size + startingFrom;
        }
        function snapRight(ms: number, startingFrom: number, size: number) {
            const beat = (ms - startingFrom) / size;
            if (beat % 1 < 0.01 || 1 - (beat % 1) < 0.01) 
                return Math.round(beat + 1) * size + startingFrom;
            
            return Math.ceil(beat) * size + startingFrom;
        }
        
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === " ")  
                aud.setPlaying(!aud.playing);
            else if (e.code === "ShiftLeft") {
                setPosition(ms => {
                    if (first_event_ms == null || MS_PER_BEAT == null) return ms;
                    if (ms <= first_event_ms) return 0;
                    return snapLeft(ms, first_event_ms, MS_PER_BEAT);
                });
            }
            else if (e.code === "ShiftRight") {
                setPosition(ms => {
                    if (first_event_ms == null || MS_PER_BEAT == null) return ms;
                    if (ms < first_event_ms) return first_event_ms;
                    return snapRight(ms, first_event_ms, MS_PER_BEAT);
                });
            }
            else if (e.key === "ArrowLeft")
                setPosition(prev => prev - 1);
            else if (e.key === "ArrowRight")
                setPosition(prev => prev + 1);
            else if (e.ctrlKey && e.key === "s")
                handleSave()
        }
        window.addEventListener("wheel", onScroll);
        window.addEventListener("keydown", onKeyDown);
        
        return () => { 
            window.removeEventListener("wheel", onScroll); 
            window.removeEventListener("keydown", onKeyDown); 
        }
    }, [aud.playing, MS_PER_BEAT, first_event_ms, snaps]);
    
    function toggleEventHere(key: string) {
        const pos = aud.getTruePosition();
        
        setSaved(false);
        setEvents(tree => {
            if (!tree) return null;
            
            const treeWithoutEvent = deleteEventFrom(tree, [pos, ":" + key]);
            if (treeWithoutEvent) {
                console.log("removed", [pos, ":" + key]);
                return treeWithoutEvent;
            }
            console.log("added", [pos, ":" + key]);
            
            // key didnt exist at this time, so add it
            return tree.insert(pos, [pos, ":" + key]);
        });
    }
    useEffect(() => console.log(JSON.stringify(events?.values)), [events])
    
    function deleteEventFrom(tree: Tree<number, MuseEvent>, [pos, eventStr]: MuseEvent) {
        const iter = tree.ge(pos); // must use `.ge()` instead of `.find()` bc `.ge()` gets the LEFTMOST node, not the first encountered node
        while (iter.valid && iter.key == pos) {
            // if this key exists at this time, remove it
            if (iter.value![1] == eventStr) {
                return iter.remove();
            }
            iter.next();
        }
    }
    
    const [saved, setSaved] = useState(true);
    const [savePopupVisible, setSavePopupVisible] = useState(false);
    
    async function handleSave() {
        if (!events) return;
        
        const res = [];
        for (const event of events.values) {
            res.push(event.join(" "));
        }
        
        await writeTextFile(song_folder + "chart.txt", res.join("\n"));
        setSaved(true);
    }
    async function handleQuit() {
        if (saved) return setPageParams([Page.MAIN_MENU]);
        setSavePopupVisible(true);
    }
    
    function handleEventTickerLeftClick([pos]: MuseEvent) {
        setPosition(() => pos);
    }
    function handleEventTickerRightClick(event: MuseEvent) {
        setSaved(false);
        // delete that event
        setEvents(prev => {
            if (!prev) return null;
            const treeWithEventRemoved = deleteEventFrom(prev, event);
            return treeWithEventRemoved? treeWithEventRemoved : prev;
        })
    }
    
    return (
        <>
            <Background />
            { savePopupVisible && 
                <SaveChangesPopup 
                    onClose={() => setSavePopupVisible(false)}
                    saveChanges={handleSave}
                />
            }
            <div className="absolute cover m-1 flex flex-col">
                
                {/* top row */}
                <nav className="flex flex-col gap-5 mb-8">
                    <div className="relative flex gap-1">
                        <MuseButton onClick={handleQuit}> quit </MuseButton>
                        <MuseButton onClick={handleSave}> save {!saved && "*"} </MuseButton>
                        <div className="grow flex flex-row-reverse gap-1">
                            <MuseButton onClick={() => setTab(Tab.DETAILS)}> details </MuseButton>
                            <MuseButton onClick={() => setTab(Tab.TIMING)}> timing </MuseButton>
                            <MuseButton onClick={() => setTab(Tab.NOTES)}> notes </MuseButton>
                        </div>
                    </div>
                    
                    <Inspector 
                        bpm={bpm} 
                        measureSize={measureSize}
                        snaps={snaps}
                        offsetPosition={position} 
                        duration={aud.duration} 
                        events={events}
                        onTickerLeftClick={handleEventTickerLeftClick}
                        onTickerRightClick={handleEventTickerRightClick}
                    />
                </nav>
                
                <div className="relative grow">
                    { tab == Tab.NOTES && events && <Notes events={events} position={position} onHit={toggleEventHere} />}
                    { tab == Tab.TIMING && 
                        <Timing 
                            bpm={bpm} 
                            measureSize={measureSize}
                            snaps={snaps}
                            setBPM={setBPM} 
                            setMeasureSize={setMeasureSize}
                            setSnaps={setSnaps}
                        />
                    }
                    { tab == Tab.DETAILS && <Details />}
                </div>
                
                {/* bottom row */}
                <nav className="flex gap-2 items-center">
                    <div className="min-w-20 max-w-20">
                        <MuseButton onClick={() => aud.setPlaying(!aud.playing)}> 
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

type SaveChangesProps = Readonly<{
    onClose: () => any
    saveChanges: () => Promise<void>
}>
function SaveChangesPopup({ onClose, saveChanges }: SaveChangesProps) {
    const [_, setPageParams] = usePage();
    return (
        <div className="
            fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col
            border-2 border-foreground bg-background rounded-md z-50 p-2 gap-2
        ">
            <div className="flex justify-between">
                <h1 className="text-center grow"> you have unsaved changes! </h1>
                <MuseButton onClick={onClose}> x </MuseButton>
            </div>
            <div className="flex gap-3">
                <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}> discard changes </MuseButton>
                <MuseButton onClick={() => 
                    saveChanges().then(() => setPageParams([Page.MAIN_MENU]))
                }> save and quit </MuseButton>
            </div>
        </div>
    )
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


