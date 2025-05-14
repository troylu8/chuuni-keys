import { useState, useEffect } from "react";
import { useDelta, HIT_WINDOWS } from "../../providers/delta";

export default function AccuracyBar() {
    const [_, addDeltaListener] = useDelta();
    
    const [deltas, setDeltas] = useState<[number, number][]>([]);
    
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            if (delta != "miss") {
                setDeltas(prev => [...prev, [Math.random(), delta]]);
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
        <div className="
            absolute left-1/2 -translate-x-1/2 bottom-3
            w-25 h-[2px] rounded-full bg-foreground
        ">
            <AccuracyTick delta={0} color="var(--foreground)" />
            {
                deltas.map(([id, delta]) => <AccuracyTick key={id} delta={delta} color="var(--foreground)" onEnd={popDelta} />)
            }
        </div>
    )
}

type Props = Readonly<{
    delta: number,
    color: string,
    onEnd?: () => void
}>
function AccuracyTick({ delta, color, onEnd }: Props) {
    const percentAlongHitWindow = (delta + HIT_WINDOWS[2] / 2) / HIT_WINDOWS[2] * 100;
    
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