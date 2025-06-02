import { useState, useEffect } from "react";
import { useDelta, MISS_THRESHOLD, getPraise } from "../providers/score";

type Props = Readonly<{
    showRawDeltas?: boolean
}>
export default function AccuracyBar({showRawDeltas}: Props) {
    const [_, addDeltaListener] = useDelta();
    
    const [praise, setPraise] = useState("");
    const [deltas, setDeltas] = useState<[number, number][]>([]);
    
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            if (delta == "miss") setPraise("miss");
            else {
                setPraise(showRawDeltas? "" + Math.round(delta) : getPraise(delta));
                if (Math.abs(delta) < MISS_THRESHOLD) {
                    setDeltas(prev => [...prev, [Math.random(), delta as number]]);
                }
            }
        });
        
        return unlisten;
    }, []);
    
    function popDelta() {
        setDeltas(prev => {
            const next = [...prev];
            next.shift();
            return next;
        });
    }
    
    return (
        <div className="relative w-25 h-[2px] rounded-full bg-foreground">
            <div className="absolute left-1/2 -translate-x-1/2 bottom-5 text-xl"> {praise} </div>
            <AccuracyTick delta={0} color="var(--foreground)" />
            {
                deltas.map(([id, delta]) => <AccuracyTick key={id} delta={delta} color="var(--foreground)" onEnd={popDelta} />)
            }
        </div>
    );
}

type AccuracyTickProps = Readonly<{
    delta: number,
    color: string,
    onEnd?: () => void
}>
function AccuracyTick({ delta, color, onEnd }: AccuracyTickProps) {
    const percentAlongHitWindow = (delta + MISS_THRESHOLD) / (MISS_THRESHOLD * 2) * 100;
    
    return (
        <div 
            style={{background: color, left: `${percentAlongHitWindow}%`}}
            className={`
                absolute top-1/2 -translate-y-1/2 -translate-x-1/2
                w-[2px] h-[10px] rounded-full ${onEnd && "anim-accuracy-tick"}
            `}
            onAnimationEnd={onEnd}
        ></div>
    )
}