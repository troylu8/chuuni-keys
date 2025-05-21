import { useEffect, useRef, useState } from "react";

const PX_PER_MS = 0.2;

type Props = Readonly<{
    bpm: number | null
    offset: number | null
    position: number
    duration: number
}>
export default function Inspector({ bpm, offset, position, duration }: Props) {
    
    // const BEAT_DURATION = bpm != null ? 60 / bpm * 1000 : 0;
    // const PX_PER_BEAT = 60 / bpm * 1000
    const contRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const onResize = () => {
            console.log("setting width");
            setWidth(contRef.current?.clientWidth ?? 0)
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => { window.removeEventListener("resize", onResize); }
    }, []);
    
    const absCenterPx = position * PX_PER_MS;
    // const absStartPx = absCenterPx - Math.min(absCenterPx, width/2);
    const startPx = width/2 - Math.min(absCenterPx, width/2);
    const endPx = width/2 + Math.min(duration * PX_PER_MS - absCenterPx, width/2);
    
    return (
        <div ref={contRef} className="relative w-full">
            <div 
                style={{left: startPx, width: endPx - startPx}} 
                className="absolute bottom-0 h-[3px] bg-foreground rounded-full"
            ></div>
            <div className="inspector-tick left-1/2 bg-blue-500 h-5"></div>
            
        </div>
    );
}