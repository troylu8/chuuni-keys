import { useEffect, useRef, useState } from "react";
import { GOOD_THRESHOLD, useDelta } from "../../providers/score";
import { useMuseEvents } from "../../providers/game-manager";
import { resetAnimation } from "../../lib/globals";

export default function Combo() {
    const [combo, setCombo] = useState(0);
    const [,addDeltaListener] = useDelta();
    const addMuseListener = useMuseEvents();
    
    const comboLabelRef = useRef<HTMLParagraphElement | null>(null);
    
    useEffect(() => {
        
        const unlistenDelta = addDeltaListener(delta => {
            setCombo(prev => delta == "miss" || delta > GOOD_THRESHOLD ? 0 : prev + 1);
            if (comboLabelRef.current) resetAnimation(comboLabelRef.current);
        });
        const unlistenStart = addMuseListener("start", () => {
            setCombo(0);
            if (comboLabelRef.current) resetAnimation(comboLabelRef.current);
        })
        
        return () => {
            unlistenDelta();
            unlistenStart();
        }
    }, []);
    
    return (
        <> 
            { combo != 0 &&
                <p ref={comboLabelRef} className="absolute top-7 right-3 text-[5vh] anim-combo"> {combo}x </p>
            }
        </>
    );
}