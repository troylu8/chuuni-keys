import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, ReactNode } from "react"


const HITRING_DURATION_MS = 600


type Props = Readonly<{
    keyCode: string,
    hitringEvent: string,
    children?: string,
    labelCentered?: boolean
}>
export default function KeyIcon( { keyCode, hitringEvent, children, labelCentered }: Props ) {
    
    const [pressed, setPressed] = useState(false);
    const [hitrings, setHitrings] = useState<[number, ReactNode][]>([]);
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== keyCode) return;
            
            setPressed(true);
            
            if (hitrings.length == 0) return console.log("early");
            
            // const delta = hitrings[0][0] - Date.no
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
            console.log("got hitringevent", e);
            setHitrings(prev => [
                ...prev, 
                [
                    e.payload as number,
                    <Hitring 
                        key={e.payload as number}
                        onEnd={popHitring}
                    />
                ]
            ]);
        });
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            unlisten.then(unlisten => unlisten());
            console.log("unloaded listeners");
        }
    }, [])
    
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
            { hitrings }
        </div>
    )
}

type HitringProps = Readonly<{
    onEnd: () => any
}>
function Hitring({onEnd}: HitringProps) {
    return (
        <div 
            className="absolute outline-foreground outline-2"
            style={{animation: `hitring ${HITRING_DURATION_MS / 1000}s linear forwards, fade-in 0.2s ease-in forwards`}}
            onAnimationEnd={e => {
                if (e.animationName === "hitring") onEnd();
            }}
        ></div>
    );
}