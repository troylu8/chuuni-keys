import { useEffect, useRef, useState } from "react";

const PX_PER_MS = 0.1;

type Props = Readonly<{
    bpm: number | null
    offset: number | null
    position: number
    duration: number
}>
export default function Inspector({ bpm, offset, position, duration }: Props) {
    
    const MS_PER_BEAT = bpm &&  60 / bpm * 1000;
    const PX_PER_BEAT = MS_PER_BEAT && MS_PER_BEAT * PX_PER_MS;
    
    const contRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const onResize = () => setWidth(contRef.current?.clientWidth ?? 0);
        onResize();
        window.addEventListener("resize", onResize);
        return () => { window.removeEventListener("resize", onResize); }
    }, []);
    
    const absCenterPx = position * PX_PER_MS;
    const startPx = width/2 - Math.min(absCenterPx, width/2);
    const endPx = width/2 + Math.min(duration * PX_PER_MS - absCenterPx, width/2);
    
    
    const absStartPx = absCenterPx - Math.min(absCenterPx, width/2);
    const firstBeatPx = PX_PER_BEAT && startPx + diffToNext(absStartPx, PX_PER_BEAT);
    const ticks = [];
    if (firstBeatPx) {
        for (let px = firstBeatPx; px <= endPx; px += PX_PER_BEAT) {
            const absPx = (px - startPx + absStartPx)
            const ms = absPx / PX_PER_MS;
            console.log(ms);
            ticks.push(<div key={px} style={{left: px}} className="inspector-tick bg-black h-3"></div>);
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

function diffToNext(num: number, n: number) {
    return num % n == 0? 0 : n - num % n;
}