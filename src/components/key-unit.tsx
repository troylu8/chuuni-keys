import { ReactNode, useEffect, useState } from "react";
import { useSfx } from "../providers/sfx";


const KEY_SIZE = 48;

type Props = Readonly<{
    onHit?: () => any
    keyCode: string
    activated?: boolean
    label?: ReactNode
    labelCentered?: boolean
    hitProgresses: number[]
}>
export function KeyUnit( { onHit, keyCode, label, labelCentered, hitProgresses, activated = hitProgresses.length != 0 }: Props ) {
    const [ pressed, setPressed ] = useState(false);
    const playSfx = useSfx();
    
    useEffect(() => {
        
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== keyCode) return; 
            setPressed(true);
            playSfx("hitsound");
            if (onHit) onHit();
        }
        window.addEventListener("keydown", handleKeyDown);
        
        function handleKeyUp(e: KeyboardEvent) {
            if (e.key === keyCode) setPressed(false);
        }
        window.addEventListener("keyup", handleKeyUp);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        }
    }, [onHit]);
    
    return (
        <div 
            style={{width: KEY_SIZE, height: KEY_SIZE}}
            className={`
                flex flex-col-reverse rounded-xl relative
                ${pressed? "bg-foreground text-background" : "bg-background opacity-25" }
                ${labelCentered? "items-center justify-center" : "[&>span]:ml-3"}
                ${activated && "opacity-100 transition-opacity"}
            `}
        >
            <span className="text-lg"> { label } </span>
            { hitProgresses.map((p, i) => <Hitring key={i} progress={p} />) }
        </div>
    );
}

const HITRING_MAX_GAP = 45;

type HitringProps = Readonly<{
    progress: number
}>
function Hitring({ progress }: HitringProps) {
    const gap = HITRING_MAX_GAP * Math.max(progress, 0);
    
    return (
        <>
            <div 
                className="absolute outline-foreground outline-3"
                style={{
                    top: -gap,
                    bottom: -gap,
                    left: -gap,
                    right: -gap,
                    borderRadius: (2 * gap + KEY_SIZE) * 0.25,  // total size * 0.25
                    opacity: (1 - progress) / 0.8
                }}
            ></div>
        </>
    );
}