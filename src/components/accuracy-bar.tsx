import { useState, useEffect, useRef } from "react";
import { useDelta, getPraise, GOOD_THRESHOLD, Praise, PRAISE_COLORS } from "../contexts/score";
import { resetAnimation } from "../lib/globals";

type Props = Readonly<{
    showRawDeltas?: boolean
}>
export default function AccuracyBar({showRawDeltas}: Props) {
    const [, addDeltaListener] = useDelta();
    
    const [praise, setPraise] = useState<Praise | number>("");
    const [deltas, setDeltas] = useState<[number, number][]>([]);
    
    const praiseLabelRef = useRef<HTMLParagraphElement | null>(null);
    
    // listen to delta events
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            if (delta == "miss") setPraise("miss");
            else {
                setPraise(showRawDeltas? Math.round(delta) : getPraise(delta));
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
    
    const praiseColor = PRAISE_COLORS[typeof praise === "number" ? getPraise(praise) : praise];
    
    return (
        <div className="relative w-[15vw] h-[2px] rounded-full bg-background">
            <div className="
                absolute left-1/2 -translate-x-1/2 bottom-0 -translate-y-full
                h-[7vh] flex justify-center items-center
            ">
                <p ref={praiseLabelRef} style={{color: praiseColor}} className="anim-praise"> {praise} </p>
            </div>
            
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