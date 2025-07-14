import { EditorParams, Page, usePage } from "../../contexts/page";
import Background from "../../components/background";
import { useEffect, useRef, useState } from "react";
import Inspector from "./inspector";
import Modal from "../../components/modal";
import { MuseEvent, readChartFile } from "../../contexts/game-manager";
import createTree, { Tree } from "functional-red-black-tree";
import EditorKeyboard from "./editor-keyboard";
import { rename, writeTextFile } from "@tauri-apps/plugin-fs";
import MuseButton from "../../components/muse-button";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { getChartFolder, flags, stringifyIgnoreNull, ChartMetadata } from "../../lib/lib";
import TimingTab from "./timing-tab";
import DetailsTab from "./details-tab";
import bgm from "../../lib/sound";
import { useBgmPos, useBgmState } from "../../contexts/bgm-state";
import Slider from "../../components/slider";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { useTitlebarText } from "../../lib/titlebar";


type ActiveTab = "keyboard" | "timing" | "details";
enum ActiveModal { NONE, CONFIRM_QUIT_TO_SELECT, CONFIRM_QUIT_APP }

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
    const { metadata: savedMetadata, isNew } = params as EditorParams;
    
    const [metadata, setMetadataInner] = useState<ChartMetadata & {imgCacheBust?: string}>(savedMetadata);
    async function setMetadata(metadata: ChartMetadata, save: boolean = false, imgCacheBust?: string) {
        setMetadataInner({...metadata, imgCacheBust });
        if (save) await handleSave(metadata, true);
        else            setSaved(false);
    }
    const chartFolder = getChartFolder(metadata);
    
    useTitlebarText(metadata.title + (metadata.credit_audio? " - " + metadata.credit_audio : ""));
    
    const [events, setEvents] = useState<Tree<number, MuseEvent>>(createTree());
    
    const [activeModal, setActiveModal] = useState(ActiveModal.NONE);
    const [activeTab, setActiveTabInner] = useState<ActiveTab>(() => {
        flags.keyUnitsEnabled = true;
        return isNew? "timing" : "keyboard";
    });
    function setActiveTab(tab: ActiveTab) {
        bgm.pause();
        flags.keyUnitsEnabled = tab == "keyboard";
        setActiveTabInner(tab);
    }
    
    function loadResources(audioPos: number) {
        bgm.src = `${chartFolder}\\audio.${metadata.audio_ext}`;
        bgm.pos = audioPos;
        
        readChartFile(chartFolder + "\\chart.txt").then(events => {
            let tree = createTree<number, MuseEvent>((a, b) => a - b);
            
            for (const event of events) {
                tree = tree.insert(event[0], event);
            }
            
            setEvents(tree);
        });
    }
    useEffect(() => loadResources(0), []); // load resources on init
    
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
        const pos = bgm.pos;
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
    
    const workingChartFolderRef = useRef(chartFolder);
    
    const [saved, setSaved] = useState(true);
    async function handleSave(newMetadata: ChartMetadata = metadata, force: boolean = false) {
        if (saved && !force) return;
        
        const newChartFolder = getChartFolder(newMetadata);
        
        // rename chart folder to match new title
        const workingChartFolder = workingChartFolderRef.current;
        if (newChartFolder != workingChartFolder) {
            await rename(workingChartFolder, newChartFolder);
            workingChartFolderRef.current = chartFolder;
        }
        
        await Promise.all([
            writeTextFile(newChartFolder + "\\chart.txt", events.values.map(e => e.join(" ")).join("\n")),
            writeTextFile(newChartFolder + "\\metadata.json", stringifyIgnoreNull(newMetadata)),
        ]);
        
        if (newChartFolder != workingChartFolder) loadResources(bgm.pos);
        
        setSaved(true);
        
        // if this chart was online before and is still online now
        if (newMetadata.online_id && metadata.online_id == newMetadata.online_id)
            localStorage.setItem("unsynced." + newMetadata.id, "");
    }
    function handleQuit() {
        if (saved) {
            bgm.speed = 1;
            setPageParams([Page.CHART_SELECT, {activeChartId: metadata.id}]);
        }
        else setActiveModal(ActiveModal.CONFIRM_QUIT_TO_SELECT);
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
        const MS_PER_BEAT = 60 / metadata.bpm * 1000;
        const MS_PER_SNAP = MS_PER_BEAT / (metadata.snaps + 1);
        const FIRST_BEAT = metadata.first_beat;
        
        function onScroll(e: WheelEvent) {
            bgm.pause();
            const snapSize = 
                e.ctrlKey ? MS_PER_BEAT : 
                e.altKey ? 1 :
                MS_PER_SNAP;
            
            if (e.deltaY < 0) {
                bgm.pos = snapLeft(bgm.pos, FIRST_BEAT, snapSize);
            }
            else {
                bgm.pos = snapRight(bgm.pos, FIRST_BEAT, snapSize);
            }
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === " ")
                bgm.paused ? bgm.play() : bgm.pause();
            else if (e.code === "ShiftLeft") 
                bgm.pos = bgm.pos <= FIRST_BEAT ? 0 : snapLeft(bgm.pos, FIRST_BEAT, MS_PER_SNAP);
            else if (e.code === "ShiftRight") 
                bgm.pos = bgm.pos < FIRST_BEAT ? FIRST_BEAT : snapRight(bgm.pos, FIRST_BEAT, MS_PER_SNAP);
            else if (e.key === "ArrowLeft")
                bgm.pos -= 1;
            else if (e.key === "ArrowRight")
                bgm.pos += 1;
            else if (e.ctrlKey && e.key === "s")
                handleSave();
            else if (e.ctrlKey && e.key === "z")
                handleUndo();
            else if (e.ctrlKey && e.key === "y")
                handleRedo();
            else if (e.key === "Escape")
                handleQuit();
        }
        
        if (activeTab != "details" && activeModal == ActiveModal.NONE) {
            window.addEventListener("wheel", onScroll);
            window.addEventListener("keydown", onKeyDown);
        };
        
        return () => { 
            window.removeEventListener("wheel", onScroll); 
            window.removeEventListener("keydown", onKeyDown); 
        }
    }, [metadata.id, metadata.first_beat, saved, activeTab, activeModal]);
    
    return (
        <>
            <Background 
                brightness={activeTab == "keyboard" ? 30 : 15}
                imgPath={metadata.img_ext && `${workingChartFolderRef.current}\\img.${metadata.img_ext}`} 
                imgCacheBust={metadata.imgCacheBust} 
            />
            <div className="absolute cover flex flex-col">
                
                {/* top row */}
                <nav className="flex flex-col gap-5 mb-8 z-20">
                    <div className="relative flex gap-3 m-2">
                        <MuseButton 
                            className="[--btn-color:var(--color-ctp-red)] outline-btn" 
                            onClick={handleQuit}
                        > <ArrowLeft /> quit </MuseButton>
                        <MuseButton 
                            className={"outline-btn " + (saved? "[--btn-color:var(--color-ctp-blue)]" : "[--btn-color:var(--color-ctp-yellow)]")}
                            onClick={() => handleSave()}
                        > {saved ? "saved" : "save *"} </MuseButton>
                        <div className="grow flex flex-reverse justify-end gap-3">
                            {   
                                ["keyboard", "timing", "details"].map(tab => 
                                    <MuseButton
                                        key={tab}
                                        className={
                                            "[--btn-color:var(--color-ctp-mauve)] " +
                                            (tab == activeTab ? "outline-btn-selected" : "outline-btn")
                                        }
                                        onClick={() => setActiveTab(tab as ActiveTab)}
                                    > 
                                        {tab} 
                                    </MuseButton>
                                )
                            }
                        </div>
                    </div>
                    
                    <Inspector 
                        metadata={metadata}
                        events={events}
                        deleteEvent={event => {
                            appendHistory([false, event]); 
                            deleteEvent(event);
                        }}
                    />
                </nav>
                
                {/* center */}
                <div className="relative grow">
                    { (activeModal != ActiveModal.NONE) && 
                        <ConfirmQuitModal 
                            onClose={() => setActiveModal(ActiveModal.NONE)}
                            saveChanges={handleSave}
                            quit={() => {
                                activeModal == ActiveModal.CONFIRM_QUIT_TO_SELECT ? 
                                    setPageParams([Page.MAIN_MENU]) :
                                    getCurrentWindow().destroy()
                            }}
                        />
                    }
                    
                    { activeTab == "keyboard" &&
                        <EditorKeyboard events={events} onHit={toggleEventHere} />
                    }
                    
                    { activeTab == "timing" && 
                        <TimingTab
                            metadata={metadata}
                            setMetadata={setMetadata}
                            setOffsetHere={() => setMetadata({...metadata, first_beat: bgm.pos})}
                            setPreviewHere={() => setMetadata({...metadata, preview_time: bgm.pos})}
                        />
                    }
                    { activeTab == "details" && 
                        <DetailsTab
                            metadata={metadata}
                            workingChartFolderRef={workingChartFolderRef}
                            setMetadata={setMetadata}
                            handleSave={handleSave}
                        />
                    }
                </div>
                
                {/* bottom row */}
                <nav className="flex gap-2 items-center m-2  z-20">
                    <MusicControls firstBeat={metadata.first_beat} previewTime={metadata.preview_time}/>
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
            <div className="flex gap-2 p-2">
                <MuseButton onClick={quit}> discard changes </MuseButton>
                <MuseButton onClick={() => saveChanges().then(quit)}> save and quit </MuseButton>
            </div>
        </Modal>
    )
}

type Props = Readonly<{
    firstBeat: number
    previewTime: number
}>
function MusicControls({ firstBeat, previewTime }: Props) {
    const { paused } = useBgmState();
    
    return (
        <>
            <MuseButton 
                onClick={() => paused? bgm.play() : bgm.pause()}
                className="p-1 flex items-center text-ctp-mauve"
            > 
                {paused? <Play size={20} /> : <Pause size={20} /> }  
            </MuseButton>
            
            <SeekBar 
                ticks={[
                    ["first beat",      firstBeat, "var(--color-ctp-teal)"],
                    ["preview time",    previewTime, "var(--color-green-600)"],
                ]}
            />
            
            <SpeedEditor />
        </>
    )
}


function SpeedEditor() {
    return (
        <>
            <div className="relative min-w-10 h-6">
                <div 
                    className="
                        absolute left-0 right-0 bottom-0
                        flex flex-col gap-2
                    "
                >
                    <SpeedButton speed={2} />
                    <SpeedButton speed={1} />
                    <SpeedButton speed={0.5} />
                    <SpeedButton speed={0.25} />
                </div>
            </div>
        </>
    );
}
function SpeedButton({ speed }: { speed: number }) {
    const { speed: currentSpeed } = useBgmState();
    
    return (
        <button
            onClick={() => bgm.speed = speed}
            className={
                "font-mono rounded-md target-color [--btn-color:var(--color-ctp-mauve)] " +
                (currentSpeed == speed ? "outline-btn-selected" : "outline-btn")
            } 
        >
            { speed * 100 }%
        </button>
    )
}


type SeekBarProps = Readonly<{
    ticks: [string, number, string][]
}>
function SeekBar({ ticks }: SeekBarProps) {
    const { duration } =  useBgmState();
    const pos = useBgmPos();
    
    return (
        <>
            <p> {timeDisplay(pos)} </p>
            
            <Slider
                min={0}
                max={duration}
                bind={[pos, pos => bgm.pos = pos]}
                thumbClassName="seek-bar-tick bg-blue-500"
            >
                {
                    ticks.map(([key, ms, backgroundColor]) => 
                        <div 
                            key={key}
                            style={{left: ms / duration * 100 + "%", backgroundColor}} 
                            className="seek-bar-tick"
                        ></div>
                    )
                }
            </Slider>
        </>
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