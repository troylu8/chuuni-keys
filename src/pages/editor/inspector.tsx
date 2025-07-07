import { Tree } from "functional-red-black-tree";
import { useEffect, useRef, useState } from "react";
import { MuseEvent } from "../../contexts/game-manager";
import { useBgmPos, useBgmState } from "../../contexts/bgm-state";
import { useSettings } from "../../contexts/settings";
import bgm from "../../lib/sound";
import { ChartMetadata } from "../../lib/lib";

const PX_PER_MS = 0.1;

function toInspectorDisplay(event: string) {
    return (event.startsWith(":")) ? event.substring(1) : event;
}
export function getBeatDuration(bpm: number) {
    return 60 / bpm * 1000;
}

type Props = Readonly<{
    metadata: ChartMetadata
    events: Tree<number, MuseEvent>
    deleteEvent: (e: MuseEvent) => void
}>
export default function Inspector({ metadata, events, deleteEvent }: Props) {
    const {bpm, first_beat, measure_size, snaps, preview_time} = metadata;
    const [{offset}] = useSettings();
    const offsetPos = useBgmPos() + offset;
    const { duration } = useBgmState();
    
    const MS_PER_BEAT = getBeatDuration(bpm);
    const PX_PER_BEAT = MS_PER_BEAT * PX_PER_MS;
    const PX_PER_SNAP = PX_PER_BEAT / (snaps + 1);
    
    const ABS_FIRST_PX = first_beat * PX_PER_MS;
    
    function diffToNext(absPx: number, size: number) {
        const pxAfterFirst = absPx - ABS_FIRST_PX;
        if (pxAfterFirst < 0) return -pxAfterFirst;
        return pxAfterFirst % size == 0? 0 : size - pxAfterFirst % size;
    }
    
    const contRef = useRef<HTMLDivElement | null>(null);
    
    // keep track of window width
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const onResize = () => setWidth(contRef.current?.clientWidth ?? 0);
        onResize();
        window.addEventListener("resize", onResize);
        return () => { window.removeEventListener("resize", onResize); }
    }, []);
    
    
    
    // regarding horizontal bar
    const absCenterPx = offsetPos * PX_PER_MS;
    const absStartPx = absCenterPx - Math.min(absCenterPx, width/2);
    const absEndPx = Math.min(absCenterPx + width/2, duration * PX_PER_MS);
    const startPx = width/2 - Math.min(absCenterPx, width/2);
    const endPx = width/2 + Math.min(duration * PX_PER_MS - absCenterPx, width/2);
    
    const inspectorElements = [];
    const firstBeatPx = startPx + diffToNext(absStartPx, PX_PER_BEAT);
    let beat = Math.round((absStartPx + diffToNext(absStartPx, PX_PER_BEAT) - ABS_FIRST_PX) / PX_PER_BEAT);
    for (let px = firstBeatPx; px <= endPx; px += PX_PER_BEAT) {
        inspectorElements.push(
            <div 
                key={px} 
                style={{left: px, height: beat % measure_size == 0? 18 : 12}} 
                className="inspector-tick bg-background">
            </div>
        );
        
        beat++;
    }
    const firstSnapPx = startPx + diffToNext(absStartPx, PX_PER_SNAP);
    let snap = Math.round((absStartPx + diffToNext(absStartPx, PX_PER_SNAP) - ABS_FIRST_PX) / PX_PER_SNAP);
    for (let px = firstSnapPx; px <= endPx; px += PX_PER_SNAP) {
        if (snap % (snaps + 1) != 0) {
            inspectorElements.push(
                <div 
                    key={px} 
                    style={{left: px}} 
                    className="inspector-tick h-1.5 bg-red-500">
                </div>
            );
        }
        snap++;
    }
    
    /** use the resulting value on the "left: ___px" css property */
    function getPosOnInspector(ms: number) {
        const absPx = ms * PX_PER_MS;
        return absPx - absStartPx + startPx;
    }
    
    // [px, event]
    const allCols: [number, MuseEvent[]][] = [];
    let prevMs = -1;
    events?.forEach( // calculate visible columns
        (_, event) => {
            const ms = event[0];
            
            // if time changed, start a new column
            if (ms != prevMs) {
                allCols.push([getPosOnInspector(ms), [event]]);
            }
            
            // time is still the same, add to previous column
            else {
                allCols[allCols.length-1][1].push(event)
            }
            
            prevMs = ms;
        },
        absStartPx / PX_PER_MS,
        absEndPx / PX_PER_MS
    );
    for (const [px, events] of allCols) {
        inspectorElements.push(
            <MuseEventColumn 
                key={px + "col"} 
                px={px} 
                events={events}
                deleteEvent={deleteEvent}
            />
        );
    }
    
    
    return (
        <div ref={contRef} className="relative w-full">
            
            {/* horizontal inspector bar */}
            <div 
                style={{left: startPx, right: -startPx}} 
                className="absolute bottom-0 h-[3px] bg-background rounded-full"
            ></div>
            
            { inspectorElements }
            
            {/* current position marker */}
            <div className="inspector-tick left-1/2 bg-blue-500 h-5"></div>
            
            {/* first beat marker */}
            <div 
                style={{left: getPosOnInspector(first_beat)}} 
                className="inspector-tick bg-color1 h-5">
            </div>
            
            {/* preview time marker */}
            <div 
                style={{left: getPosOnInspector(preview_time)}} 
                className="inspector-tick bg-color2 h-5">
            </div>
        </div>
    );
}

const MAX_EVENTS_PER_COLUMN = 3;

type KeyColumnProps = Readonly<{
    px: number
    events: MuseEvent[]
    deleteEvent: (e: MuseEvent) => void
}>
function MuseEventColumn({ px, events, deleteEvent }: KeyColumnProps) {
    
    // only show the first (MAX_EVENTS_PER_COLUMN) events.
    // 
    // if too many events, show 1 less than (MAX_EVENTS_PER_COLUMN) events 
    // to make room for the ticker with a number label for the # of hidden events
    const visibleEvents = events.length <= MAX_EVENTS_PER_COLUMN ? events : events.slice(0, MAX_EVENTS_PER_COLUMN-1);
    
    // display events in alphabetical order
    visibleEvents.sort(); 
    
    function setPos(pos: number) {
        bgm.pause();
        bgm.pos = pos;
    }
    
    return (
        <div 
            style={{left: px}} 
            className="absolute -translate-x-1/2 top-1 flex flex-col items-center font-mono"
        >
            { 
                visibleEvents.map((e, i) => (
                    <MuseEventTicker 
                        key={i} 
                        onLeftClick={() => setPos(e[0])}
                        onRightClick={() => deleteEvent(e)}
                    > { toInspectorDisplay(e[1]) } </MuseEventTicker>
                ))
            }
            
            {/* the extra ticker showing # of events exceeding MAX_EVENTS_PER_COLUMN */}
            { events.length > MAX_EVENTS_PER_COLUMN && 
                <MuseEventTicker
                    onLeftClick={() => setPos(events[0][0])}
                > {events.length - MAX_EVENTS_PER_COLUMN + 1} </MuseEventTicker>
            }
        </div>
    )
}

type MuseEventTickerProps = Readonly<{
    children: React.ReactNode
    onLeftClick?: () => any 
    onRightClick?: () => any
}>
function MuseEventTicker({ children, onLeftClick, onRightClick }: MuseEventTickerProps) {
    
    return (
        <button 
            className="
                font-mono text-sm rounded-sm bg-background px-1
                hover:bg-color2 hover:text-background
            "
            onClick={() => {if (onLeftClick) onLeftClick()}}
            onContextMenu={() => { if (onRightClick) onRightClick(); }}
        > { children } </button>
    )
}