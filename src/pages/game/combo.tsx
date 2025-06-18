import { useEffect, useState } from "react";
import { GOOD_THRESHOLD, useDelta } from "../../providers/score";
import { useMuseEvents } from "../../providers/game-manager";

export default function Combo() {
    const [combo, setCombo] = useState(0);
    const [,addDeltaListener] = useDelta();
    const addMuseListener = useMuseEvents();
    
    useEffect(() => {
        
        const unlistenDelta = addDeltaListener(delta => {
            setCombo(prev => delta == "miss" || delta > GOOD_THRESHOLD ? 0 : prev + 1);
        });
        const unlistenStart = addMuseListener("start", () => {
            setCombo(0);
        })
        
        return () => {
            unlistenDelta();
            unlistenStart();
        }
    }, []);
    
    return (
        <> 
            { combo != 0 &&
                <div className="absolute top-7 right-3 text-3xl"> {combo}x </div>
            }
        </>
    );
}