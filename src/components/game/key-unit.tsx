import { useEffect, useState, ReactNode, useRef } from "react"
import { HITRING_DURATION, useGameControls, useMuseEvents } from "../../providers/game-state";
import { HIT_WINDOWS, useDelta } from "../../providers/delta";
import { useSfx } from "../../providers/sfx";
import { usePlayback } from "../../providers/playback";




const KEY_HEIGHT = 48;

type Props = Readonly<{
    keyCode: string,
    hitringEvent: string,
    children?: string,
    labelCentered?: boolean
}>
export default function KeyUnit( { keyCode, hitringEvent, children, labelCentered }: Props ) {
    const getPosition = usePlayback()[3];
    const [paused] = useGameControls();
    const addMuseListener = useMuseEvents();
    const [pressed, setPressed] = useState(false);
    const [hitrings, setHitrings] = useState<[number, ReactNode][]>([]);
    const [broadcastDelta] = useDelta();
    
    useEffect(() => {
        function popHitring() {
            setHitrings(prev => {
                const next = [...prev];
                next.shift()
                return next;
            })
        }
        
        function handleKeyDown(e: KeyboardEvent) {
            if (paused || e.key !== keyCode) return; 
            
            setPressed(true);
            
            if (hitrings.length == 0) return console.log("none!");
            
            const delta = getPosition() - hitrings[0][0];
            
            if (Math.abs(delta) <= HIT_WINDOWS[2] / 2) {
                console.log("diff: ", delta);
                broadcastDelta(delta);
            }
            else {
                console.log("miss!", delta);
                broadcastDelta("miss");
            }
            popHitring();
        }
        function handleKeyUp(e: KeyboardEvent) {
            if (e.key === keyCode) setPressed(false);
        }
        
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        const unlisten = addMuseListener(hitringEvent, time => {
            
            const hitTime = time as number + HITRING_DURATION;
            
            setHitrings(prev => [
                ...prev, 
                [
                    hitTime,
                    <Hitring 
                        key={hitTime}
                        hitTime={hitTime}
                        onEnd={() => {
                            popHitring();
                            broadcastDelta("miss");
                        }}
                    />
                ]
            ]);
        });
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            unlisten();
        }
    }, [hitrings, paused]);
    
    
    
    return (
        <div 
            style={{width: KEY_HEIGHT, height: KEY_HEIGHT}}
            className={`
                outline-foreground outline-2 rounded-xl relative
                ${pressed? "bg-foreground text-background" : "bg-background" }
                flex flex-col-reverse
                ${labelCentered? "items-center justify-center" : "[&>span]:ml-3"}
            `}
        >
            <span className="text-lg"> { children } </span>
            { hitrings.map(pair => pair[1]) }
        </div>
    )
}

const HITRING_MAX_GAP = 30;

type HitringProps = Readonly<{
    hitTime: number,
    onEnd: () => any
}>
function Hitring({ hitTime, onEnd }: HitringProps) {
    
    const addMuseListener = useMuseEvents();
    
    const getPosition = usePlayback()[3];
    const [progress, setProgress] = useState(1);
    const playSfx = useSfx();
    
    const hitringDuration = useRef(hitTime - getPosition()).current;
    
    useEffect(() => {
        
        let hitsoundPlayed = false;
        
        const unlisten = addMuseListener("update", () => {
            
            const pos = getPosition();
                
            if (pos >= hitTime && !hitsoundPlayed) {
                playSfx("hitsound.ogg");
                hitsoundPlayed = true;
                console.log(pos, hitTime, Date.now());
            }
            
            // if last hit window has passed
            if (pos >= hitTime + HIT_WINDOWS[2] / 2) {
                unlisten();
                onEnd();
                return;
            }
            
            setProgress(Math.max((hitTime - pos) / hitringDuration, 0));
        });
        
        return unlisten;
        
    }, []);
    
    const gap = HITRING_MAX_GAP * progress;
    
    return (
        <>
            <div 
                className="absolute outline-foreground outline-3"
                style={{
                    top: -gap,
                    bottom: -gap,
                    left: -gap,
                    right: -gap,
                    borderRadius: (2 * gap + KEY_HEIGHT) * 0.25,  // total size * 0.25
                    opacity: (1 - progress) / 0.6
                }}
            ></div>
        </>
    );
}