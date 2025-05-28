import { useEffect, useState, ReactNode, useRef } from "react"
import { HITRING_DURATION, useGameControls, useMuseEvents } from "../../providers/game-manager";
import { MISS_THRESHOLD, useDelta } from "../../providers/score";
import { useSfx } from "../../providers/sfx";
import { usePlayback } from "../../providers/playback";
import { KeyUnit } from "../../components/key-unit";


type Props = Readonly<{
    keyCode: string,
    museEvent: string,
    children?: ReactNode,
    labelCentered?: boolean
}>
export default function KeyUnitGame( { keyCode, museEvent, children, labelCentered }: Props ) {
    const { getPosition } = usePlayback();
    const [ playing ] = useGameControls();
    const addMuseListener = useMuseEvents();
    const [ pressed, setPressed ] = useState(false);
    
    /** `[hittime, progress]` */
    const [ hitTimes, setHitTimes ] = useState<[number, number][]>([]);
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
            
            if (hitTimes.length == 0) return console.log("none!");
            
            const delta = getPosition() - hitTimes[0][0];
            
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
        window.addEventListener("keydown", handleKeyDown);
        
        
        const unlistenPos = addMuseListener("pos-change", pos => {
            if (hitTimes.length != 0 && pos > hitTimes[0][0] + MISS_THRESHOLD) {
                console.log("disappeared at ", pos);
                popHitTime();
                broadcastDelta("miss");
            }
            
            // recalculate progresses
            setHitTimes(prev => prev.map(([hitTime]) => [hitTime, (hitTime - pos) / HITRING_DURATION]));
        });
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            unlistenPos(); 
        }
    }, [hitTimes, playing]);
    
    useEffect(() => {
        
        const unlistenStart = addMuseListener("start", () => {
            setHitTimes([]);
            console.log("clearing hitrings");
        });
        const unlistenHitring = addMuseListener(museEvent, (_, hitTime) => {
            console.log("got", museEvent, hitTime);
            setHitTimes(prev => [...prev, [hitTime, 1]]);
        });
        function handleKeyUp(e: KeyboardEvent) {
            if (e.key === keyCode) setPressed(false);
        }
        window.addEventListener("keyup", handleKeyUp);
        return () => { 
            unlistenStart();
            unlistenHitring();
            window.removeEventListener("keyup", handleKeyUp);
        }
    }, []);
    
    return (
        <KeyUnit 
            pressed={pressed} 
            label={children} 
            labelCentered={labelCentered} 
            hitProgresses={hitTimes.map(([_, progress]) => progress)}
            activated={hitTimes.length != 0}
        />
    );
}