import { useEffect, useState } from "react";
import { useDelta } from "../../providers/score";

export default function Combo() {
    const [combo, setCombo] = useState(0);
    const [_, addDeltaListener] = useDelta();
    
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            setCombo(prev => delta == "miss"? 0 : prev + 1);
        });
        
        return unlisten;
    }, []);
    
    return (
        <> 
            { combo != 0 &&
                <div className="absolute top-7 right-3 text-3xl"> {combo}x </div>
            }
        </>
    );
}