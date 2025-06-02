import { useEffect, useState, ReactNode } from "react"
import { HITRING_DURATION, useGameControls, useMuseEvents } from "../../providers/game-manager";
import { MISS_THRESHOLD, useDelta } from "../../providers/score";
import { usePlayback } from "../../providers/playback";
import { KeyUnit } from "../../components/key-unit";


type Props = Readonly<{
    keyCode: string,
    museEvent: string,
    children?: ReactNode,
    labelCentered?: boolean
}>
export default function KeyUnitGame( { keyCode, museEvent, children, labelCentered }: Props ) {
    const { getPosition, addPosUpdateListener } = usePlayback();
    const [ playing ] = useGameControls();
    const addMuseListener = useMuseEvents();
    
    /** `[hittime, progress]` */
    const [ hitTimes, setHitTimes ] = useState<[number, number][]>([]);
    const [ broadcastDelta ] = useDelta();
    
    function popHitTime() {
        setHitTimes(prev => {
            const next = [...prev];
            next.shift()
            return next;
        });
    }
    
    function onHit() {
        if (hitTimes.length == 0) return console.log("none!");
        broadcastDelta(getPosition() - hitTimes[0][0]);
        popHitTime();
    }
    useEffect(() => {
        if (!playing) return;
        const unlistenPos = addPosUpdateListener(pos => {
            if (hitTimes.length != 0 && pos > hitTimes[0][0] + MISS_THRESHOLD) {
                popHitTime();
                broadcastDelta("miss");
            }
            
            // recalculate progresses
            setHitTimes(prev => prev.map(([hitTime]) => [hitTime, (hitTime - pos) / HITRING_DURATION]));
        });
        return unlistenPos;
    }, [hitTimes, playing]);
    
    useEffect(() => {
        const unlistenStart = addMuseListener("start", () => {
            setHitTimes([]);
            console.log("clearing hitrings");
        });
        const unlistenHitring = addMuseListener(museEvent, (_, hitTime) => {
            setHitTimes(prev => [...prev, [hitTime, 1]]);
        });
        return () => { 
            unlistenStart();
            unlistenHitring();
        }
    }, []);
    
    return (
        <KeyUnit 
            keyCode={keyCode}
            onHit={onHit}
            label={children} 
            labelCentered={labelCentered} 
            hitProgresses={hitTimes.map(([_, progress]) => progress)}
        />
    );
}