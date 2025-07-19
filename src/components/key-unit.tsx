import { ReactNode, useEffect, useState } from "react";
import { playSfx } from "../lib/sound";
import { flags } from "../lib/lib";
import { KEY_SIZE } from "./keyboard-layout";


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
    fadeOut?: boolean
}>
export function KeyUnit( { onHit, keyCode, label, labelCentered, hitProgresses, activated = hitProgresses.length != 0, fadeOut }: Props ) {
    const [ pressed, setPressed ] = useState(false);
    
    function hit() {
        playSfx("hitsound");
        if (onHit) onHit();
    }
    
    useEffect(() => {
        
        function handleKeyDown(e: KeyboardEvent) {
            if (flags.keyUnitsEnabled && e.key === keyCode && noModifiersPressed(e) && !pressed ) {
                setPressed(true);
                hit();
            }
        }
        function handleKeyUp(e: KeyboardEvent) {
            if (keyCode === "a")
                console.log("keyup");
            if (e.key === keyCode) setPressed(false);
        }
        
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        }
    }, [onHit, pressed, keyCode]);
    
    const allHitsPassed = hitProgresses.length != 0 && hitProgresses.every(v => v < 0);
    const latestHitProgress = hitProgresses.reduce((accum, curr) => Math.max(accum, curr), -Infinity);
    return (
        <div
            onClick={() => {if (flags.keyUnitsEnabled) hit()}}
            style={{
                width: KEY_SIZE, 
                height: KEY_SIZE,
                
                // if all hits have passed, set opacity based on how long ago the last hit was, with a min of 25%
                opacity: fadeOut && allHitsPassed ? Math.max(0.25, 1 + latestHitProgress) : undefined 
            }}
            className={`
                flex flex-col-reverse rounded-[25%] relative text-ctp-base
                ${pressed? "bg-ctp-mauve" : "bg-light opacity-25" }
                ${labelCentered && "items-center justify-center"}
                ${activated && "opacity-100 transition-opacity"}
            `}
        >
            <span className="text-lg ml-[25%]"> { label } </span>
            { hitProgresses.map((p, i) => <Hitring key={i} progress={p} />) }
        </div>
    );
}



const HITRING_MAX_GAP = 70;

type HitringProps = Readonly<{
    progress: number
}>
function Hitring({ progress }: HitringProps) {
    const gap = HITRING_MAX_GAP * Math.max(progress, 0);
    
    return (
        <>
            <div 
                className="absolute outline-ctp-mauve outline-[1.4vh] pointer-events-none"
                style={{
                    top: -gap,
                    bottom: -gap,
                    left: -gap,
                    right: -gap,
                    borderRadius: `calc((2 * ${gap}px + ${KEY_SIZE}) * 0.25)`, // total size * 0.25
                    opacity: (1 - progress) / 0.9
                }}
            ></div>
        </>
    );
}