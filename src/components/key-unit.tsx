import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, ReactNode, useRef } from "react"
import { useAbsoluteStartTime } from "../providers/start-time";
import { usePaused } from "../providers/paused";


const HIT_WINDOWS = [50, 150, 300];

const KEY_HEIGHT = 48;

type Props = Readonly<{
    keyCode: string,
    hitringEvent: string,
    children?: string,
    labelCentered?: boolean
}>
export default function KeyUnit( { keyCode, hitringEvent, children, labelCentered }: Props ) {
    const [absoluteStartTime] = useAbsoluteStartTime();
    const [paused] = usePaused();
    const [pressed, setPressed] = useState(false);
    const [hitrings, setHitrings] = useState<[number, ReactNode][]>([]);
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (paused || e.key !== keyCode) return; 
            
            setPressed(true);
            
            if (hitrings.length == 0) return console.log("none!");
            
            const delta = Date.now() - absoluteStartTime - hitrings[0][0];
            
            console.log("diff: ", delta);
        }
        function handleKeyUp(e: KeyboardEvent) {
            if (e.key === keyCode) setPressed(false);
        }
        
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        function popHitring() {
            setHitrings(prev => {
                const next = [...prev];
                next.shift()
                return next;
            })
        }
        
        const unlisten = listen(hitringEvent, e => {
            
            if (absoluteStartTime == 0) return; // received an event before start time was set
            
            const hitTime = e.payload as number;
            
            setHitrings(prev => [
                ...prev, 
                [
                    hitTime,
                    <Hitring 
                        key={hitTime}
                        hitTime={hitTime}
                        onEnd={popHitring}
                    />
                ]
            ]);
        });
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            unlisten.then(unlisten => unlisten());
        }
    }, [absoluteStartTime, hitrings, paused]);
    
    
    
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
    const [absoluteStartTime] = useAbsoluteStartTime();
    const [progress, setProgress] = useState(1);
    const [paused] = usePaused();
    
    const absoluteHitTime = absoluteStartTime + hitTime;
    
    const hitringDuration = useRef(absoluteHitTime - Date.now()).current;
    const rafId = useRef<number | null>(null);
    
    
    useEffect(() => {
        console.log("useeffect called");
        
        if (paused && rafId.current != null) {
            console.log("pause!!!!");
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
        else if (!paused) {
            
            function update() {
                const now = Date.now();
                
                // if last hit window has passed
                if (now > absoluteHitTime + HIT_WINDOWS[2] / 2) {
                    cancelAnimationFrame(rafId.current!);
                    rafId.current = null;
                    onEnd();
                    return;
                }
                
                setProgress(Math.max((absoluteHitTime - now) / hitringDuration, 0));
                
                if (rafId.current != null) rafId.current = requestAnimationFrame(update);
            }
            rafId.current = requestAnimationFrame(update);
        }
        
    }, [paused]);
    
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