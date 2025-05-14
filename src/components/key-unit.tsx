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
            
            console.log(Date.now() - absoluteStartTime, hitrings[0][0]);
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
            console.log("got hitringevent", e, absoluteStartTime);
            
            if (absoluteStartTime == 0) return; // received an event before start time was set
            
            const hitTime = e.payload as number;
            
            setHitrings(prev => [
                ...prev, 
                [
                    hitTime,
                    <Hitring 
                        key={hitTime}
                        absoluteHitTime={absoluteStartTime + hitTime}
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

type HitringProps = Readonly<{
    absoluteHitTime: number,
    onEnd: () => any
}>
function Hitring({ absoluteHitTime, onEnd }: HitringProps) {
    const [gap, setGap] = useState(30);
    const [paused] = usePaused();
    
    const durationSecs = useRef((absoluteHitTime - Date.now()) / 1000);
    
    let rafId = useRef<number | null>(null);
    
    useEffect(() => {
        if (paused && rafId.current != null) cancelAnimationFrame(rafId.current);
        else if (!paused) {
            
            function update() {
                
                
                rafId.current = requestAnimationFrame(update);
            }
            rafId.current = requestAnimationFrame(update);
        }
        
    }, [paused])
    
    return (
        <div 
            className="absolute outline-foreground outline-2"
            style={{
                animation: `hitring ${durationSecs.current}s linear forwards, fade-in 0.2s ease-in forwards`,
                animationPlayState: paused? "paused" : "running"
            }}
            onAnimationEnd={e => {
                if (e.animationName === "hitring") {
                    
                    // wait until final hit window is over before removing this 
                    const callOnEnd = setTimeout(onEnd, HIT_WINDOWS[2] / 2); 
                }
            }}
        ></div>
    );
}