import { useEffect, useRef, useState } from "react";
import { usePlayback } from "../../providers/playback";
import { useSettings } from "../../providers/settings";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { KeyUnit } from "../../components/key-unit";
import { HITRING_DURATION } from "../../providers/game-manager";
import MuseButton from "../../components/muse-button";
import AccuracyBar from "../../components/accuracy-bar";
import DeltaProvider, { useDelta } from "../../providers/score";

const MS_PER_BEAT = 500;
const MS_FIRST_BEAT = 450;
const MS_LAST_BEAT = 1950;
const MS_PER_LOOP = 2000;

type Props = Readonly<{
    onClose: () => any
}>
export default function TimingEditor({ onClose }: Props) {
    const [settings, setSettings] = useSettings();
    const { playNewAudio, getPosition, clearAudio, addPosUpdateListener } = usePlayback();
    const [sinceLastBeat, setSinceLastBeat] = useState(0);
    
    useEffect(() => {
        appLocalDataDir().then(applocaldatadir => {
            playNewAudio(applocaldatadir + "\\userdata\\metronome.mp3", true);
        });
        
        const unlisten = addPosUpdateListener(pos => {
            setSinceLastBeat((pos < MS_FIRST_BEAT)? pos + MS_PER_LOOP - MS_LAST_BEAT : pos % MS_PER_BEAT);
        });
        
        return unlisten;
    }, []);
    
    function handleClose() {
        clearAudio();
        onClose();
    }
    
    return (
        <div className="absolute cover flex flex-col items-center justify-center bg-gray-500">
            <div className="absolute left-1 top-1">
                <MuseButton onClick={handleClose}> exit </MuseButton>
            </div>
            <DeltaProvider>
                <Metronome msSinceLastBeat={sinceLastBeat} />
            </DeltaProvider>
        </div>
    );
}

type MetronomeProps = Readonly<{
    msSinceLastBeat: number
}>
function Metronome({ msSinceLastBeat }: MetronomeProps) {
    const [broadcastDelta] = useDelta();
    
    const test = useRef([0, 0]);
    
    const msTilNextBeat = MS_PER_BEAT - msSinceLastBeat;
    const hitProgresses = [];
    
    // add hitProgresses until they are > 1
    for (let i = 0; true; i++) {
        const progress = (msTilNextBeat + MS_PER_BEAT * i) / HITRING_DURATION;
        if (progress > 1) break;
        hitProgresses.push(progress);
    }
    test.current = [msTilNextBeat, msSinceLastBeat];
    
    return (
        <div className="flex flex-col gap-20 items-center">
            <KeyUnit 
                keyCode="z" 
                onHit={() => {
                    console.log(test.current);
                    broadcastDelta(Math.min(test.current[0], test.current[1]))
                }} 
                label="z" 
                hitProgresses={hitProgresses} 
            />
            <AccuracyBar />
        </div>
    );
}