import { useEffect, useState, ReactNode } from "react"
import { useMuseEvents } from "../../contexts/game-manager";
import { GOOD_THRESHOLD, HIT_THRESHOLD, useDelta } from "../../contexts/score";
import { KeyUnit } from "../../components/key-unit";
import { useSettings } from "../../contexts/settings";
import bgm from "../../lib/sound";
import { useBgmPos } from "../../contexts/bgm-state";


type Props = Readonly<{
    keyCode: string,
    museEvent: string,
    children?: ReactNode,
    labelCentered?: boolean
}>
export default function KeyUnitGame( { keyCode, museEvent, children, labelCentered }: Props ) {
    const [{offset, hitringDuration}] = useSettings();
    const pos = useBgmPos();
    
    const [ broadcastDelta ] = useDelta();
    const addMuseListener = useMuseEvents();
    
    const [ hitTimes, setHitTimes ] = useState<number[]>([]);
    
    function popHitTime() {
        if (hitTimes.length == 0) return;
        const offsetPos = bgm.pos + offset;
        
        const delta = Math.abs(offsetPos - hitTimes[0]);
        if (delta > HIT_THRESHOLD) return; // if not even considered a hit, ignore
        
        broadcastDelta(offsetPos - hitTimes[0]);
        setHitTimes(hitTimes.slice(1));
    }

    // pop hitrings when theyre too late to be hit
    useEffect(() => {
        const unlistenPos = bgm.addPosListener(pos => {
            const offsetPos = pos + offset;
            if (hitTimes.length != 0 && offsetPos > hitTimes[0] + GOOD_THRESHOLD) {
                popHitTime();
            }
        });
        return unlistenPos;
    }, [hitTimes]);
    
    // add/clear hitrings on museEvent/start
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
            hitProgresses={hitTimes.map(hitTime => (hitTime - pos + offset) / hitringDuration)}
        />
    );
}