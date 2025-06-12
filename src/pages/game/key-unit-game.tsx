import { useEffect, useState, ReactNode } from "react"
import { HITRING_DURATION, useMuseEvents } from "../../providers/game-manager";
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
    const { getOffsetPosition, addPosUpdateListener } = usePlayback();
    const [ broadcastDelta ] = useDelta();
    const addMuseListener = useMuseEvents();
    
    const [ hitTimes, setHitTimes ] = useState<number[]>([]);
    const [ progresses, setHitProgresses ] = useState<number[]>([]);
    
    function updateHitProgresses(offset_pos: number) {
        setHitProgresses(hitTimes.map(hitTime => (hitTime - offset_pos) / HITRING_DURATION));
    }
    
    function popHitTime() {
        setHitTimes(prev => {
            const next = [...prev];
            next.shift();
            return next;
        });
    }
    
    function onHit() {
        if (hitTimes.length == 0) return console.log("none!");
        broadcastDelta(getOffsetPosition() - hitTimes[0]);
        popHitTime();
    }
    useEffect(() => {
        const unlistenPos = addPosUpdateListener(offset_pos => {
            if (hitTimes.length != 0 && offset_pos > hitTimes[0] + MISS_THRESHOLD) {
                popHitTime();
                broadcastDelta("miss");
            }
            updateHitProgresses(offset_pos);
        });
        return unlistenPos;
    }, [hitTimes]);
    
    useEffect(() => {
        const unlistenStart = addMuseListener("start", () => {
            setHitTimes([]);
        });
        const unlistenHitring = addMuseListener(museEvent, (_, hitTime) => {
            setHitTimes(prev => {
                const next = [...prev, hitTime];
                console.log(prev, next);
                return next;
            });
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
            hitProgresses={progresses}
        />
    );
}