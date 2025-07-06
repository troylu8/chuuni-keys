import { useState, useEffect } from "react";
import { useDelta, getPraise, GOOD_THRESHOLD, PRAISE_COLORS } from "../contexts/score";

export default function AccuracyBar() {
    const [, addDeltaListener] = useDelta();
    
    const [deltas, setDeltas] = useState<[number, number][]>([]);
    
    
    // listen to delta events
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            if (delta != "miss" && Math.abs(delta) < GOOD_THRESHOLD) {
                setDeltas(prev => [...prev, [Math.random(), delta as number]]);
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
        <div className="relative w-[15vw] h-[2px] rounded-full bg-background">
            <AccuracyTick delta={0} color="var(--background)" />
            {
                deltas.map(([id, delta]) => <AccuracyTick key={id} delta={delta} color={PRAISE_COLORS[getPraise(delta)]} onEnd={popDelta} />)
            }
        </div>
    );
}

type AccuracyTickProps = Readonly<{
    delta: number
    color: string
    onEnd?: () => void
}>
function AccuracyTick({ delta, color, onEnd }: AccuracyTickProps) {
    const percentAlongHitWindow = (delta + GOOD_THRESHOLD) / (GOOD_THRESHOLD * 2) * 100;
    
    return (
        <div 
            style={{background: color, left: `${percentAlongHitWindow}%` }}
            className={`
                absolute top-1/2 -translate-y-1/2 -translate-x-1/2
                w-[2px] h-[3vh] rounded-full ${onEnd && "anim-accuracy-tick"}
            `}
            onAnimationEnd={onEnd}
        ></div>
    )
}