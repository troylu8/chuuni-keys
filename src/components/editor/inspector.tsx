import { Tree } from "functional-red-black-tree";
import { useEffect, useRef, useState } from "react";
import { MuseEvent } from "../../providers/game-manager";

const PX_PER_MS = 0.1;

function toInspectorDisplay(event: string) {
    return (event.startsWith(":")) ? event.substring(1) : event;
}

type Props = Readonly<{
    bpm: number | null
    offset: number | null
    measureSize: number | null
    snaps: number
    position: number
    duration: number
    events: Tree<number, MuseEvent> | null
}>
export default function Inspector({ bpm, offset, measureSize, snaps, position, duration, events }: Props) {
    
    const MS_PER_BEAT = bpm &&  60 / bpm * 1000;
    const PX_PER_BEAT = MS_PER_BEAT && MS_PER_BEAT * PX_PER_MS;
    const PX_PER_SNAP = PX_PER_BEAT && PX_PER_BEAT / (snaps + 1);
    
    const ABS_OFFSET_PX = offset && offset * PX_PER_MS!;
    function diffToNext(absPx: number, size: number) {
        const pxAfterOffset = absPx - ABS_OFFSET_PX!;
        if (pxAfterOffset < 0) return -pxAfterOffset;
        return pxAfterOffset % size == 0? 0 : size - pxAfterOffset % size;
    }
    
    const contRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const onResize = () => setWidth(contRef.current?.clientWidth ?? 0);
        onResize();
        window.addEventListener("resize", onResize);
        return () => { window.removeEventListener("resize", onResize); }
    }, [position]);
    
    // regarding horizontal bar
    const absCenterPx = position * PX_PER_MS;
    const absStartPx = absCenterPx - Math.min(absCenterPx, width/2);
    const absEndPx = Math.min(absCenterPx + width/2, duration * PX_PER_MS);
    const startPx = width/2 - Math.min(absCenterPx, width/2);
    const endPx = width/2 + Math.min(duration * PX_PER_MS - absCenterPx, width/2);
    
    const inspectorElements = [];
    if (PX_PER_BEAT) {
        const firstBeatPx = startPx + diffToNext(absStartPx, PX_PER_BEAT);
        let beat = Math.round((absStartPx + diffToNext(absStartPx, PX_PER_BEAT) - ABS_OFFSET_PX!) / PX_PER_BEAT);
        for (let px = firstBeatPx; px <= endPx; px += PX_PER_BEAT) {
            // const absPx = (px - startPx + absStartPx)
            
            // const ms = absPx / PX_PER_MS;
            inspectorElements.push(
                <div 
                    key={px} 
                    style={{left: px, height: beat % measureSize! == 0? 12 : 8}} 
                    className="inspector-tick bg-foreground">
                </div>
            );
            
            beat++;
        }
    }
    if (PX_PER_SNAP) {
        const firstSnapPx = startPx + diffToNext(absStartPx, PX_PER_SNAP);
        let snap = Math.round((absStartPx + diffToNext(absStartPx, PX_PER_SNAP) - ABS_OFFSET_PX!) / PX_PER_SNAP);
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
    }
    
    const allCols: [number, string[]][] = [];
    let prevMs = -1;
    events?.forEach(
        (_, event) => {
            // absMs => absPx => localPx
            const ms = event[0];
            const absPx = ms * PX_PER_MS;
            const px = absPx - absStartPx + startPx;
            
            if (ms != prevMs) {
                allCols.push([px, [toInspectorDisplay(event[1])]]);
            }
            else {
                allCols[allCols.length-1][1].push(toInspectorDisplay(event[1]))
            }
            
            prevMs = ms;
        },
        absStartPx / PX_PER_MS,
        absEndPx / PX_PER_MS
    );
    for (const [px, events] of allCols) {
        inspectorElements.push(
            <div 
                key={px + "col"} 
                style={{left: px}} 
                className="inspector-tick top-1 flex flex-col items-center"
            >
                { events.map(e => <p className="h-2">{e}</p>) }
            </div>
        )
    }
    
    return (
        <div ref={contRef} className="relative w-full">
            <div 
                style={{left: startPx, width: endPx - startPx}} 
                className="absolute bottom-0 h-[3px] bg-foreground rounded-full"
            ></div>
            <div className="inspector-tick left-1/2 bg-blue-500 h-5"></div>
            
            { inspectorElements }
        </div>
    );
}
// ticks.push(<div 
//                         key={px + event[1]} 
//                         style={{left: px}} 
//                         className="inspector-tick top-3 flex flex-col"
//                     > {currCol} </div>
//                 );