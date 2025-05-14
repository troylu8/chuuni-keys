import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, ReactNode } from "react"
import { useAbsoluteStartTime } from "../providers/start-time";
import { usePaused } from "../providers/paused";


const HITRING_DURATION_MS = 600


type Props = Readonly<{
    keyCode: string,
    hitringEvent: string,
    children?: string,
    labelCentered?: boolean
}>
export default function KeyUnit( { keyCode, hitringEvent, children, labelCentered }: Props ) {
    const absoluteStartTime = useAbsoluteStartTime();
    const [paused] = usePaused();
    const [pressed, setPressed] = useState(false);
    const [hitrings, setHitrings] = useState<[number, ReactNode][]>([]);
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!paused && e.key !== keyCode) return; 
            
            setPressed(true);
            
            if (hitrings.length == 0) return console.log("none!");
            
            console.log(Date.now() - absoluteStartTime, hitrings[0][0]);
            const delta = Date.now() - absoluteStartTime - hitrings[0][0];
            
            console.log("diff: ", delta);
        }
        function handleKeyUp(e: KeyboardEvent) {
            if (!paused && e.key === keyCode) setPressed(false);
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
                        durationSecs={(absoluteStartTime + hitTime - Date.now()) / 1000}
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
            className={`
                w-12 h-12 outline-foreground outline-2 rounded-xl relative
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
    durationSecs: number,
    onEnd: () => any
}>
function Hitring({ durationSecs, onEnd }: HitringProps) {
    const [paused] = usePaused()
    
    return (
        <div 
            className="absolute outline-foreground outline-2"
            style={{
                animation: `hitring ${durationSecs}s linear forwards, fade-in 0.2s ease-in forwards`,
                animationPlayState: paused? "paused" : "running"
            }}
            onAnimationEnd={e => {
                if (e.animationName === "hitring") onEnd();
            }}
        ></div>
    );
}