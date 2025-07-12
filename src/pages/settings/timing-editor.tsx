import { useEffect, useState } from "react";
import { useBgmPos } from "../../contexts/bgm-state";
import { useSettings } from "../../contexts/settings";
import { KeyUnit } from "../../components/key-unit";
import MuseButton from "../../components/muse-button";
import AccuracyBar from "../../components/accuracy-bar";
import DeltaProvider, { Delta, getPraise, PRAISE_COLORS, useDelta } from "../../contexts/score";
import bgm from "../../lib/sound";
import { USERDATA_DIR } from "../../lib/lib";
import Praise from "../../components/praise";

const MS_PER_BEAT = 500;
const MS_FIRST_BEAT = 475;
const MS_LAST_BEAT = 1975;
const MS_PER_LOOP = 2000;

type Props = Readonly<{
    onClose: () => any
}>
export default function TimingEditor({ onClose }: Props) {
    const [{ offset, hitringDuration }, setSettings] = useSettings();
    
    const pos = useBgmPos();
    const offsetPos = pos + offset;
    const msSinceLastBeat = (offsetPos < MS_FIRST_BEAT)? offsetPos + MS_PER_LOOP - MS_LAST_BEAT : offsetPos % MS_PER_BEAT;
    
    
    useEffect(() => {
        bgm.src = USERDATA_DIR + "\\metronome.mp3";
        bgm.play();
        
        let prevI = 0;
        
        const unlisten = bgm.addPosListener(pos => {
            if (pos > MS_PER_LOOP) 
                bgm.pos = pos - MS_PER_LOOP;
            
            const i = Math.floor((pos + offset - MS_FIRST_BEAT) / MS_PER_BEAT);
            if (i != prevI && i != -1) {
                // playSfx("hitsound");
                prevI = i;
            }
        });
        
        return unlisten;
    }, [offset]);
    
    function handleClose() {
        bgm.pause();
        onClose();
    }
    
    return (
        <div className="absolute cover flex flex-col items-center justify-center bg-gray-500 gap-10">
            <MuseButton className="absolute left-1 top-1" onClick={handleClose}> exit </MuseButton>
            
            <div className="flex gap-8 items-center">
                <div className="flex flex-col gap-20">
                    <input 
                        type="number" 
                        value={offset}
                        onChange={e => setSettings("offset", Number(e.target.value))} 
                    />
                    <input 
                        type="number" 
                        value={hitringDuration}
                        onChange={e => setSettings("hitringDuration", Number(e.target.value))} 
                    />
                </div>
                <DeltaProvider>
                    <Metronome msSinceLastBeat={msSinceLastBeat} />
                    <DeltaHistory />
                </DeltaProvider>
            </div>
            
            <div className="absolute left-0 bottom-0 h-3 bg-ctp-red" style={{width: (msSinceLastBeat / MS_PER_BEAT * 100) + "%" }}></div>
        </div>
    );
}

type MetronomeProps = Readonly<{
    msSinceLastBeat: number
}>
function Metronome({ msSinceLastBeat }: MetronomeProps) {
    const [broadcastDelta] = useDelta();
    const [{hitringDuration}] = useSettings();
    
    const msTilNextBeat = MS_PER_BEAT - msSinceLastBeat;
    const hitProgresses = [];
    
    // add hitProgresses until they are > 1
    for (let i = 0; true; i++) {
        const progress = (msTilNextBeat + MS_PER_BEAT * i) / hitringDuration;
        if (progress > 1) break;
        hitProgresses.push(progress);
    }
    
    return (
        <div className="flex flex-col gap-20 items-center">
            <KeyUnit 
                keyCode="z"
                label="z"
                onHit={() => broadcastDelta( msTilNextBeat < msSinceLastBeat ? -msTilNextBeat : msSinceLastBeat )}
                hitProgresses={hitProgresses}
            />
            <AccuracyBar />
            <Praise showRawDeltas />
        </div>
    );
}

const MAX_DELTA_HISTORY = 10;

function DeltaHistory() {
    const [, addDeltaListener] = useDelta();
    
    const [history, setHistory] = useState<[number, Delta][]>([]);
    
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            setHistory(prev => {
                const next: [number, Delta][] = [...prev, [Math.random(), delta]];
                if (next.length > MAX_DELTA_HISTORY) next.shift();
                return next;
            });
        });
        return unlisten;
    }, []);
    
    return (
        <div className="flex flex-col-reverse items-center w-20">
            {
                history.map(([key, delta]) => 
                    <p 
                        key={key}    
                        style={{
                            color: PRAISE_COLORS[getPraise(delta)],
                            height: 1 / MAX_DELTA_HISTORY * 100 * 0.7 + "vh",
                        }}
                    > 
                        { typeof delta == "number" ? Math.round(delta) : delta } 
                    </p>
                )
            }
        </div>
    )
}