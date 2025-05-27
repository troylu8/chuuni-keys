import { useEffect, useState, ReactNode, useRef } from "react"
import { HITRING_DURATION, useGameControls, useMuseEvents } from "../../providers/game-manager";
import { MISS_THRESHOLD, useDelta } from "../../providers/score";
import { useSfx } from "../../providers/sfx";
import { usePlayback } from "../../providers/playback";
import { KeyUnit } from "../../components/key-unit";


type Props = Readonly<{
    keyCode: string,
    hitringEvent: string,
    children?: ReactNode,
    labelCentered?: boolean
}>
export default function KeyUnitGame( { keyCode, hitringEvent, children, labelCentered }: Props ) {
    const { getPosition } = usePlayback();
    const [ playing ] = useGameControls();
    const addMuseListener = useMuseEvents();
    const [ pressed, setPressed ] = useState(false);
    
    /** `[hittime, progress]` */
    const [ hitrings, setHitTimes ] = useState<[number, number][]>([]);
    const [ broadcastDelta ] = useDelta();
    const playSfx = useSfx();
    
    function popHitTime() {
        setHitTimes(prev => {
            const next = [...prev];
            next.shift()
            return next;
        })
    }
    
    useEffect(() => {
        if (!playing) return;
        
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== keyCode) return; 
            
            setPressed(true);
            playSfx("hitsound");
            
            if (hitrings.length == 0) return console.log("none!");
            
            const delta = getPosition() - hitrings[0][0];
            
            if (Math.abs(delta) <= MISS_THRESHOLD) {
                console.log("diff: ", delta);
                broadcastDelta(delta);
            }
            else {
                console.log("miss!", delta);
                broadcastDelta("miss");
            }
            popHitTime();
        }
        function handleKeyUp(e: KeyboardEvent) {
            if (e.key === keyCode) setPressed(false);
        }
        
        const unlistenPos = addMuseListener("pos-change", pos => {
            if (hitrings.length != 0 && pos > hitrings[0][0] + MISS_THRESHOLD) {
                popHitTime();
                broadcastDelta("miss");
            }
            
            // recalculate progresses
            setHitTimes(prev => prev.map(([hitTime]) => [hitTime, (hitTime - pos) / HITRING_DURATION]));
        });
        
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            unlistenPos(); 
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            
        }
    }, [hitrings, playing]);
    
    useEffect(() => {
        
        const unlistenStart = addMuseListener("start", () => {
            setHitTimes([]);
            console.log("clearing hitrings");
        });
        const unlistenHitring = addMuseListener(hitringEvent, time => {
            const hitTime = time as number + HITRING_DURATION;
            setHitTimes(prev => [...prev, [hitTime, 1]]);
        });
        return () => { 
            unlistenStart();
            unlistenHitring();
        }
    }, []);
    
    return (
        <KeyUnit 
            pressed={pressed} 
            label={children} 
            labelCentered={labelCentered} 
            hitProgresses={hitrings.map(([_, progress]) => progress)}
        />
    );
}