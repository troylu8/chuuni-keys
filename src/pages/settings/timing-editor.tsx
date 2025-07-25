import { useEffect, useState } from "react";
import { useBgmPos } from "../../contexts/bgm-state";
import { useSettings } from "../../contexts/settings";
import { KeyUnit } from "../../components/key-unit";
import MuseButton from "../../components/muse-button";
import AccuracyBar from "../../components/accuracy-bar";
import DeltaProvider, { Delta, getPraise, PRAISE_COLORS, useDelta } from "../../contexts/score";
import bgm from "../../lib/sound";
import { RESOURCE_DIR } from "../../lib/lib";
import Praise from "../../components/praise";
import NumberInput from "../../components/number-input";
import { ArrowLeft } from "lucide-react";

const MS_PER_BEAT = 500;
const MS_LAST_BEAT = 10000;

const MIN_HITRING_SPEED = 1;
const MAX_HITRING_SPEED = 9;
const MIN_HITRING_DURATION = 200;
const MAX_HITRING_DURATION = 1000;

function hitringSpeedToDuration(speed: number) {
    return (
        (1 - (speed - MIN_HITRING_SPEED) / (MAX_HITRING_SPEED - MIN_HITRING_SPEED) ) *
        (MAX_HITRING_DURATION - MIN_HITRING_DURATION) + MIN_HITRING_DURATION
    );
}
function hitringDurationToSpeed(duration: number) {
    return Math.round(
        (1 - (duration - MIN_HITRING_DURATION) / (MAX_HITRING_DURATION - MIN_HITRING_DURATION) ) *
        (MAX_HITRING_SPEED - MIN_HITRING_SPEED) + MIN_HITRING_SPEED
    );
}

type Props = Readonly<{
    onClose: () => any
}>
export default function TimingEditor({ onClose }: Props) {
    const [{ offset, hitringDuration }, setSettings] = useSettings();
    
    const pos = useBgmPos();
    const offsetPos = pos + offset;
    const msSinceLastBeat = offsetPos % MS_PER_BEAT;
    
    useEffect(() => {
        bgm.load(RESOURCE_DIR + "\\metronome.mp3");
        bgm.play();
        
        bgm.onEnd = () => {
            bgm.pos = bgm.duration - MS_LAST_BEAT;
            bgm.play();
        }
        return () => { delete bgm.onEnd; }
    }, []);
    
    function handleClose() {
        bgm.pause();
        onClose();
    }
    
    return (
        <div className="absolute cover flex flex-col items-center justify-center">
            <MuseButton 
                className="absolute left-1 top-1 text-ctp-mauve" 
                onClick={handleClose}
            > <ArrowLeft /> quit </MuseButton>
            
            <div className="flex gap-16 items-center">
                <div className="flex flex-col gap-20">
                    <NumberInput 
                        label="hit offset"
                        bind={[offset, val => setSettings("offset", val)]}
                        min={-300}
                        max={300}
                        largeIncrements
                    />
                    <NumberInput 
                        label="hitring speed"
                        min={MIN_HITRING_SPEED}
                        max={MAX_HITRING_SPEED}
                        bind={[
                            hitringDurationToSpeed(hitringDuration), 
                            speed => setSettings("hitringDuration", hitringSpeedToDuration(speed))
                        ]}
                        largeIncrements
                    />
                </div>
                <DeltaProvider>
                    <Metronome msSinceLastBeat={msSinceLastBeat} />
                    <DeltaHistory />
                </DeltaProvider>
            </div>
            
            <div className="absolute left-0 bottom-0 h-1 bg-ctp-mauve" style={{width: (msSinceLastBeat / MS_PER_BEAT * 100) + "%" }}></div>
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
        <div className="flex flex-col gap-25 items-center relative">
            <KeyUnit 
                keyCode="z"
                label="z"
                onHit={() => broadcastDelta( msTilNextBeat < msSinceLastBeat ? -msTilNextBeat : msSinceLastBeat )}
                hitProgresses={hitProgresses}
            />
            <AccuracyBar />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[6vh]">
                <Praise showRawDeltas />
            </div>
        </div>
    );
}

const MAX_DELTA_HISTORY = 12;
const HISTORY_ENTRY_HEIGHT = 1 / MAX_DELTA_HISTORY * 100 * 0.7 + "vh";

function DeltaHistory() {
    const [, addDeltaListener] = useDelta();
    
    const [history, setHistory] = useState<[number, Delta][]>([]);
    
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            setHistory(prev => {
                return (prev.length == MAX_DELTA_HISTORY)?
                    [ [Math.random(), delta] ] :
                    [...prev, [Math.random(), delta]];
            });
        });
        return unlisten;
    }, []);
    
    return (
        <div 
            style={{height: `calc(${HISTORY_ENTRY_HEIGHT} * ${MAX_DELTA_HISTORY})`}}
            className="flex flex-col-reverse items-end w-20 self-end font-mono"
        >
            {
                history.map(([key, delta]) => {
                    if (delta == "miss") return;
                    
                    return (
                        <p 
                            key={key}    
                            style={{
                                color: PRAISE_COLORS[getPraise(delta)],
                                height: HISTORY_ENTRY_HEIGHT,
                            }}
                        > 
                            { ("" + Math.round(delta)).padStart(4) } 
                            &nbsp;
                            <span className={delta < 0 ? "text-ctp-yellow" : "text-ctp-red"}> 
                                { delta < 0 ? "early" : <>late&nbsp;</>} 
                                
                            </span>
                        </p>
                    )
                })
            }
        </div>
    )
}