import { ChartMetadata, GameAndEditorParams, Page, usePage } from "../../providers/page";
import { usePlayback } from "../../providers/playback";
import Background from "../../components/background";
import { useEffect, useRef, useState } from "react";
import Inspector from "./inspector";
import Modal from "../../components/modal";
import TimingModal from "./timing-modal";
import DetailsModal from "./details-modal";
import { MuseEvent, readChartFile } from "../../providers/game-manager";
import createTree, { Tree } from "functional-red-black-tree";
import EditorKeyboard from "./editor-keyboard";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import MuseButton from "../../components/muse-button";
import globals from "../../lib/globals";
import { getCurrentWindow } from '@tauri-apps/api/window';


enum ActiveModal { NONE, TIMING, DETAILS, CONFIRM_QUIT_TO_MENU, CONFIRM_QUIT_APP };

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

export default function Editor() {
    const [[,params], setPageParams] = usePage();
    const [savedMetadata, song_folder] = params as GameAndEditorParams;
    
    const [metadata, setMetadataInner] = useState<ChartMetadata>(savedMetadata);
    async function setMetadata(metadata: ChartMetadata, save: boolean = false) {
        setMetadataInner(metadata);
        if (save) await handleSave(metadata);
        else            setSaved(false);
    }
    
    const aud = usePlayback();
    // load audio file on init
    useEffect(() => { aud.loadAudio(song_folder + savedMetadata.audio); }, [savedMetadata]);
    
    const [activeModal, setActiveModalInner] = useState(() => {
        globals.keyUnitsEnabled = true;
        return ActiveModal.NONE;
    });
    function setActiveModal(modal: ActiveModal) {
        aud.setPlaying(false);
        globals.keyUnitsEnabled = modal == ActiveModal.NONE;
        setActiveModalInner(modal);
    }
    
    
    const [position, setPositionInner] = useState(0);
    function setPosition(setter: (prev: number) => number) {
        setPositionInner(prev => {
            aud.seek(setter(prev));
            return aud.getTruePosition();
        });
    }
    useEffect(() => {
        const unlisten = aud.addPosUpdateListener(offsetPos => {
            setPositionInner(offsetPos);
        });
        return unlisten;
    }, []);
    
    const ms_per_beat = metadata.bpm && 60 / metadata.bpm * 1000;
    const ms_per_snap = ms_per_beat && ms_per_beat / (metadata.snaps + 1);
    
    const [events, setEvents] = useState<Tree<number, MuseEvent>>(createTree());
    const first_event_ms = events.begin.value?.[0] ?? null;
    useEffect(() => {
        readChartFile(song_folder + "chart.txt").then(events => {
            let tree = createTree<number, MuseEvent>((a, b) => a - b);
            
            for (const event of events) {
                tree = tree.insert(event[0], event);
            }
            
            setEvents(tree);
        });
    }, [song_folder]);
    
    /** [`true/false` = added/removed event, event] */
    const historyRef = useRef<[boolean, MuseEvent][]>([]);
    const historyPosRef = useRef(0);
    function appendHistory(entry: [boolean, MuseEvent]) {
        
        // if this entry is the same as the last, ignore it
        const prev = historyRef.current[historyPosRef.current - 1];
        if (prev != undefined && prev[0] == entry[0] && prev[1][0] == entry[1][0] && prev[1][1] == entry[1][1]) {
            return;
        }
        
        // if not at the top of history, overwrite history past this point
        if (historyPosRef.current < historyRef.current.length) {
            historyRef.current = historyRef.current.slice(0, historyPosRef.current);
        }
        
        historyRef.current.push(entry);
        historyPosRef.current = historyRef.current.length;
    }
    function handleUndo() {
        if (historyPosRef.current == 0) return; 
        
        historyPosRef.current--;
        const [eventWasAdded, event] = historyRef.current[historyPosRef.current];
        
        eventWasAdded? deleteEvent(event) : addEvent(event);
    }
    function handleRedo() {
        if (historyPosRef.current == historyRef.current.length) return; 
     
        const [eventWasAdded, event] = historyRef.current[historyPosRef.current];
        historyPosRef.current++;
        
        eventWasAdded? addEvent(event) : deleteEvent(event);
    }
    
    function addEvent(event: MuseEvent) {
        setSaved(false);
        setEvents(tree => tree?.insert(event[0], event) ?? null);
    }
    function deleteEvent(event: MuseEvent) {
        setSaved(false);
        setEvents(prev => {
            const treeWithoutEvent = deleteEventFrom(prev, event);
            if (treeWithoutEvent) {
                return treeWithoutEvent;
            }
            return prev;
        });
    }
    
    function toggleEventHere(key: string) {
        console.log(activeModal);
        const pos = aud.getTruePosition();
        setSaved(false);
        
        setEvents(events => {
            const event: MuseEvent = [pos, ":" + key];
            
            const treeWithoutEvent = deleteEventFrom(events, event);
            if (treeWithoutEvent) {
                appendHistory([false, event]);
                return treeWithoutEvent;
            }
            
            // key didnt exist at this time, so add it
            appendHistory([true, event]);
            return events.insert(pos, event);
        });
    }
    
    const [saved, setSaved] = useState(true);
    async function handleSave(newMetadata: ChartMetadata = metadata) {
        if (!events) return;
        
        const res = [];
        for (const event of events.values) {
            res.push(event.join(" "));
        }
        
        await writeTextFile(song_folder + "chart.txt", res.join("\n"));
        await writeTextFile(song_folder + "metadata.json", JSON.stringify(newMetadata, null, 4));
        setSaved(true);
    }
    function handleQuit() {
        if (saved) setPageParams([Page.MAIN_MENU]);
        else setActiveModal(ActiveModal.CONFIRM_QUIT_TO_MENU);
    }
    
    // confirm if want to quit app with unsaved changes
    useEffect(() => {
        const unlisten = getCurrentWindow().onCloseRequested(e => {
            if (!saved) {
                e.preventDefault();
                setActiveModal(ActiveModal.CONFIRM_QUIT_APP);
            }
        });
        return () => { unlisten.then(unlisten => unlisten()); }
    }, [saved]);
    
    // keybinds and scroll
    useEffect(() => {
        
        function onScroll(e: WheelEvent) {
            if (ms_per_beat == null || ms_per_snap == null) return;
            setPosition(ms => {
                aud.setPlaying(false);
                const snapSize = e.ctrlKey ? ms_per_beat : ms_per_snap;
                if (e.deltaY < 0) {
                    return snapLeft(ms, first_event_ms ?? 0, snapSize);
                }
                else {
                    return snapRight(ms, first_event_ms ?? 0, snapSize);
                }
            });
        }
        function onKeyDown(e: KeyboardEvent) {
            
            if (e.key === " ")  
                aud.setPlaying(!aud.playing);
            else if (e.code === "ShiftLeft") {
                setPosition(ms => {
                    if (first_event_ms == null || ms_per_snap == null) return ms;
                    if (ms <= first_event_ms) return 0;
                    return snapLeft(ms, first_event_ms, ms_per_snap);
                });
            }
            else if (e.code === "ShiftRight") {
                setPosition(ms => {
                    if (first_event_ms == null || ms_per_snap == null) return ms;
                    if (ms < first_event_ms) return first_event_ms;
                    return snapRight(ms, first_event_ms, ms_per_snap);
                });
            }
            else if (e.key === "ArrowLeft")
                setPosition(prev => prev - 1);
            else if (e.key === "ArrowRight")
                setPosition(prev => prev + 1);
            else if (e.ctrlKey && e.key === "s")
                handleSave()
            else if (e.ctrlKey && e.key === "z")
                handleUndo()
            else if (e.ctrlKey && e.key === "y")
                handleRedo()
        }
        
        
        if (activeModal == ActiveModal.NONE) {
            window.addEventListener("wheel", onScroll);
            window.addEventListener("keydown", onKeyDown);
        };
        
        return () => { 
            window.removeEventListener("wheel", onScroll); 
            window.removeEventListener("keydown", onKeyDown); 
        }
    }, [aud.playing, first_event_ms, metadata, activeModal]);
    
    return (
        <>
            <Background imgPath={song_folder + metadata.img} />
            <div className="absolute cover m-1 flex flex-col">
                
                {/* top row */}
                <nav className="flex flex-col gap-5 mb-8 z-20">
                    <div className="relative flex gap-1">
                        <MuseButton onClick={handleQuit}> quit </MuseButton>
                        <MuseButton onClick={handleSave}> save {!saved && "*"} </MuseButton>
                        <div className="grow flex flex-row-reverse gap-1">
                            <MuseButton onClick={() => setActiveModal(ActiveModal.DETAILS)}> details </MuseButton>
                            <MuseButton onClick={() => setActiveModal(ActiveModal.TIMING)}> timing </MuseButton>
                        </div>
                    </div>
                    
                    <Inspector 
                        bpm={metadata.bpm} 
                        measureSize={metadata.measure_size}
                        snaps={metadata.snaps}
                        offsetPosition={position} 
                        duration={aud.duration} 
                        events={events}
                        setPosition={pos => setPosition(() => pos)}
                        deleteEvent={event => {
                            appendHistory([false, event]); 
                            deleteEvent(event);
                        }}
                    />
                </nav>
                
                {/* center */}
                <div className="relative grow">
                    <EditorKeyboard events={events} position={position} onHit={toggleEventHere} />
                    
                    { (activeModal == ActiveModal.CONFIRM_QUIT_TO_MENU || activeModal == ActiveModal.CONFIRM_QUIT_APP) && 
                        <ConfirmQuitModal 
                            onClose={() => setActiveModal(ActiveModal.NONE)}
                            saveChanges={handleSave}
                            quit={() => {
                                activeModal == ActiveModal.CONFIRM_QUIT_TO_MENU ? 
                                    setPageParams([Page.MAIN_MENU]) :
                                    getCurrentWindow().destroy()
                            }}
                        />
                    }
                    { activeModal == ActiveModal.TIMING && 
                        <TimingModal 
                            metadata={metadata}
                            setMetadata={setMetadata}
                            onClose={() => setActiveModal(ActiveModal.NONE)}
                        />
                    }
                    { activeModal == ActiveModal.DETAILS && 
                        <DetailsModal
                            songFolder={song_folder}
                            metadata={metadata}
                            setMetadata={setMetadata}
                            onClose={() => setActiveModal(ActiveModal.NONE)}
                        />
                    }
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

type ConfirmQuitModalProps = Readonly<{
    onClose: () => any
    saveChanges: () => Promise<void>
    quit: () => any
}>
function ConfirmQuitModal({ onClose, saveChanges, quit }: ConfirmQuitModalProps) {
    return (
        <Modal title="you have unsaved changes!" onClose={onClose}>
            <div className="flex gap-3">
                <MuseButton onClick={quit}> discard changes </MuseButton>
                <MuseButton onClick={() => saveChanges().then(quit)}> save and quit </MuseButton>
            </div>
        </Modal>
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


