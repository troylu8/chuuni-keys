import { useEffect, useState, ReactNode } from "react"
import { HITRING_DURATION, useMuseEvents } from "../../providers/game-manager";
import { GOOD_THRESHOLD, HIT_THRESHOLD, useDelta } from "../../providers/score";
import { usePlayback } from "../../providers/playback";
import { KeyUnit } from "../../components/key-unit";


type Props = Readonly<{
    keyCode: string,
    museEvent: string,
    children?: ReactNode,
    labelCentered?: boolean
}>
export default function KeyUnitGame( { keyCode, museEvent, children, labelCentered }: Props ) {
    const { getOffsetPosition, addPosUpdateListener } = usePlayback();
    const [ broadcastDelta ] = useDelta();
    const addMuseListener = useMuseEvents();
    
    const [ hitTimes, setHitTimes ] = useState<number[]>([]);
    const [ offsetPos, setOffsetPos ] = useState<number>(0);
    
    function popHitTime() {
        if (hitTimes.length == 0) return;
        
        const delta = Math.abs(getOffsetPosition() - hitTimes[0]);
        if (delta > HIT_THRESHOLD) return; // if not even considered a hit, ignore
        
        broadcastDelta(getOffsetPosition() - hitTimes[0]);
        setHitTimes(hitTimes.slice(1));
    }

    useEffect(() => {
        const unlistenPos = addPosUpdateListener(offsetPos => {
            if (hitTimes.length != 0 && offsetPos > hitTimes[0] + GOOD_THRESHOLD) {
                popHitTime();
            }
            setOffsetPos(offsetPos);
        });
        return unlistenPos;
    }, [hitTimes]);
    
    useEffect(() => {
        const unlistenStart = addMuseListener("start", () => {
            setHitTimes([]);
        });
        const unlistenHitring = addMuseListener(museEvent, (_, hitTime) => {
            setHitTimes(prev => [...prev, hitTime]);
        });
        return () => { 
            unlistenStart();
            unlistenHitring();
        }
    }, []);
    
    return (
        <KeyUnit 
            keyCode={keyCode}
            onHit={popHitTime}
            label={children} 
            labelCentered={labelCentered} 
            hitProgresses={hitTimes.map(hitTime => (hitTime - offsetPos) / HITRING_DURATION)}
        />
    );
}