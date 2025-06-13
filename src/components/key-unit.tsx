import { ReactNode, useEffect, useState } from "react";
import playSfx, { SFX } from "../lib/sfx";


const KEY_SIZE = 48;

function noModifiersPressed(e: KeyboardEvent) {
    return (
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
    );
}

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
    
    useEffect(() => {
        
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === keyCode && noModifiersPressed(e) ) {
                setPressed(true);
                playSfx(SFX.HITSOUND, 0.1);
                if (onHit) onHit();
            }
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
    
    const allHitsPassed = hitProgresses.length != 0 && hitProgresses.every(v => v < 0);
    const latestHitProgress = hitProgresses.reduce((accum, curr) => Math.max(accum, curr), -Infinity);
    return (
        <div
            onClick={() => { if (onHit) onHit() } }
            style={{
                width: KEY_SIZE, 
                height: KEY_SIZE,
                
                // if all hits have passed, set opacity based on how long ago the last hit was, with a min of 25%
                opacity: allHitsPassed? Math.max(0.25, 1 + latestHitProgress) : undefined 
            }}
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
                className="absolute outline-accent1 outline-4"
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