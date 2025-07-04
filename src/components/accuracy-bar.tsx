import { useState, useEffect, useRef } from "react";
import { useDelta, getPraise, GOOD_THRESHOLD } from "../providers/score";
import { resetAnimation } from "../lib/globals";

type Props = Readonly<{
    showRawDeltas?: boolean
}>
export default function AccuracyBar({showRawDeltas}: Props) {
    const [, addDeltaListener] = useDelta();
    
    const [praise, setPraise] = useState("");
    const [deltas, setDeltas] = useState<[number, number][]>([]);
    
    const praiseLabelRef = useRef<HTMLParagraphElement | null>(null);
    
    // listen to delta events
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            if (delta == "miss") setPraise("miss");
            else {
                setPraise(showRawDeltas? "" + Math.round(delta) : getPraise(delta));
                if (Math.abs(delta) < GOOD_THRESHOLD) {
                    setDeltas(prev => [...prev, [Math.random(), delta as number]]);
                }
            }
            if (praiseLabelRef.current) 
                resetAnimation(praiseLabelRef.current)
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
            <div className="
                absolute left-1/2 -translate-x-1/2 bottom-0 -translate-y-full
                h-[7vh] flex justify-center items-center
            ">
                <p ref={praiseLabelRef} className="anim-praise"> {praise} </p>
            </div>
            
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
    const percentAlongHitWindow = (delta + GOOD_THRESHOLD) / (GOOD_THRESHOLD * 2) * 100;
    
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