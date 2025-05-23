import { useEffect, useRef, useState } from "react";

const PX_PER_MS = 0.1;

type Props = Readonly<{
    bpm: number | null
    offset: number | null
    measureSize: number | null
    snaps: number
    position: number
    duration: number
}>
export default function Inspector({ bpm, offset, measureSize, snaps, position, duration }: Props) {
    
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
    const startPx = width/2 - Math.min(absCenterPx, width/2);
    const endPx = width/2 + Math.min(duration * PX_PER_MS - absCenterPx, width/2);
    
    const ticks = [];
    if (PX_PER_BEAT) {
        const firstBeatPx = startPx + diffToNext(absStartPx, PX_PER_BEAT);
        let beat = Math.round((absStartPx + diffToNext(absStartPx, PX_PER_BEAT) - ABS_OFFSET_PX!) / PX_PER_BEAT);
        for (let px = firstBeatPx; px <= endPx; px += PX_PER_BEAT) {
            // const absPx = (px - startPx + absStartPx)
            // const ms = absPx / PX_PER_MS;
            ticks.push(
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
                ticks.push(
                    <div 
                        aria-label={"" +snap}
                        key={px + "snap"} 
                        style={{left: px}} 
                        className="inspector-tick h-1.5 bg-red-500">
                    </div>
                );
            }
            snap++;
        }
    }
    
    return (
        <div ref={contRef} className="relative w-full">
            <div 
                style={{left: startPx, width: endPx - startPx}} 
                className="absolute bottom-0 h-[3px] bg-foreground rounded-full"
            ></div>
            <div className="inspector-tick left-1/2 bg-blue-500 h-5"></div>
            
            { ticks }
        </div>
    );
}

