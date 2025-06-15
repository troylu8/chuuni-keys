import { useState, useEffect, useRef } from "react";
import { useDelta, MISS_THRESHOLD, getPraise } from "../providers/score";

type Props = Readonly<{
    showRawDeltas?: boolean
}>
export default function AccuracyBar({showRawDeltas}: Props) {
    const [, addDeltaListener] = useDelta();
    
    const [praise, setPraise] = useState("");
    const [deltas, setDeltas] = useState<[number, number][]>([]);
    
    const praiseLabelRef = useRef<HTMLParagraphElement | null>(null);
    
    function resetPraiseFadeOutAnim() {
        const praiseLabel = praiseLabelRef.current;
        if (!praiseLabel) return;
        
        // https://stackoverflow.com/questions/6268508/restart-animation-in-css3-any-better-way-than-removing-the-element
        praiseLabel.style.animation = "none";
        praiseLabel.offsetHeight;
        praiseLabel.style.animation = "";
    }
    
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            if (delta == "miss") setPraise("miss");
            else {
                setPraise(showRawDeltas? "" + Math.round(delta) : getPraise(delta));
                if (Math.abs(delta) < MISS_THRESHOLD) {
                    setDeltas(prev => [...prev, [Math.random(), delta as number]]);
                }
            }
            resetPraiseFadeOutAnim();
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
            <p ref={praiseLabelRef} className="absolute left-1/2 -translate-x-1/2 bottom-5 text-xl anim-fade-out"> {praise} </p>
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