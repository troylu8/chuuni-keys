import { useState, useRef, useEffect } from "react";
import { useDelta, getPraise, Praise as PraiseType, PRAISE_COLORS } from "../contexts/score";
import { resetAnimation } from "../lib/lib";

type Props = Readonly<{
    showRawDeltas?: boolean
}>
export default function Praise({showRawDeltas}: Props) {
    const [, addDeltaListener] = useDelta();
    
    const [praise, setPraise] = useState<PraiseType | number>("");
    
    const praiseLabelRef = useRef<HTMLParagraphElement | null>(null);
    
    // listen to delta events
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            if (delta == "miss") setPraise("miss");
            else setPraise(showRawDeltas? Math.round(delta) : getPraise(delta));
            
            if (praiseLabelRef.current) 
                resetAnimation(praiseLabelRef.current)
        });
        
        return unlisten;
    }, []);
    
    
    const praiseColor = PRAISE_COLORS[typeof praise === "number" ? getPraise(praise) : praise];
    return (
        <p ref={praiseLabelRef} style={{color: praiseColor}} className="anim-praise font-serif"> {praise} </p>
    );
}