import { useEffect, useState } from "react";
import { usePlayback } from "../../providers/playback";
import { useSettings } from "../../providers/settings";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { KeyUnit } from "../../components/key-unit";
import { HITRING_DURATION } from "../../providers/game-manager";
import MuseButton from "../../components/muse-button";
import AccuracyBar from "../../components/accuracy-bar";
import DeltaProvider, { useDelta } from "../../providers/score";
import playSfx, { SFX } from "../../lib/sfx";

const MS_PER_BEAT = 500;
const MS_FIRST_BEAT = 475;
const MS_LAST_BEAT = 1975;
const MS_PER_LOOP = 2000;

type Props = Readonly<{
    onClose: () => any
}>
export default function TimingEditor({ onClose }: Props) {
    const [settings, setSettings] = useSettings();
    const { loadAudio, setPlaying, addPosUpdateListener, seek } = usePlayback();
    const [sinceLastBeat, setSinceLastBeat] = useState(0);
    
    
    useEffect(() => {
        appLocalDataDir().then(applocaldatadir => {
            loadAudio(applocaldatadir + "\\userdata\\metronome.mp3", true);
        });
        
        let prevI = 0;
        
        const unlisten = addPosUpdateListener((offsetPos, truePos) => {
            setSinceLastBeat((offsetPos < MS_FIRST_BEAT)? offsetPos + MS_PER_LOOP - MS_LAST_BEAT : offsetPos % MS_PER_BEAT);
            if (truePos > MS_PER_LOOP) 
                seek(truePos - MS_PER_LOOP);
            
            const i = Math.floor((offsetPos - MS_FIRST_BEAT) / MS_PER_BEAT);
            if (i != prevI && i != -1) {
                playSfx(SFX.HITSOUND);
                prevI = i;
            }
        });
        
        return unlisten;
    }, []);
    
    function handleClose() {
        setPlaying(false);
        onClose();
    }
    
    return (
        <div className="absolute cover flex flex-col items-center justify-center bg-gray-500 gap-10">
            <MuseButton className="absolute left-1 top-1" onClick={handleClose}> exit </MuseButton>
            <input 
                type="number" 
                value={settings.offset}
                onChange={e => setSettings("offset", Number(e.target.value))} 
            />
            <DeltaProvider>
                <Metronome msSinceLastBeat={sinceLastBeat} />
            </DeltaProvider>
            
            <div className="absolute left-0 bottom-0 h-3 bg-red-500" style={{width: (sinceLastBeat / MS_PER_BEAT * 100) + "%" }}></div>
        </div>
    );
}

type MetronomeProps = Readonly<{
    msSinceLastBeat: number
}>
function Metronome({ msSinceLastBeat }: MetronomeProps) {
    const [broadcastDelta] = useDelta();
    
    const msTilNextBeat = MS_PER_BEAT - msSinceLastBeat;
    const hitProgresses = [];
    
    // add hitProgresses until they are > 1
    for (let i = 0; true; i++) {
        const progress = (msTilNextBeat + MS_PER_BEAT * i) / HITRING_DURATION;
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
            <AccuracyBar showRawDeltas />
        </div>
    );
}