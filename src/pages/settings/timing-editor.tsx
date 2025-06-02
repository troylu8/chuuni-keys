import { useEffect, useState } from "react";
import { usePlayback } from "../../providers/playback";
import { useSettings } from "../../providers/settings";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { KeyUnit } from "../../components/key-unit";
import { HITRING_DURATION } from "../../providers/game-manager";
import MuseButton from "../../components/muse-button";

const MS_PER_BEAT = 500;
const MS_FIRST_BEAT = 450;
const MS_LAST_BEAT = 1950;
const MS_PER_LOOP = 2000;

type Props = Readonly<{
    onClose: () => any
}>
export default function TimingEditor({ onClose }: Props) {
    const [settings, setSettings] = useSettings();
    const { playNewAudio, clearAudio, addPosUpdateListener } = usePlayback();
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
            <Metronome msSinceLastBeat={sinceLastBeat} />
        </div>
    );
}

type MetronomeProps = Readonly<{
    msSinceLastBeat: number
}>
function Metronome({ msSinceLastBeat }: MetronomeProps) {
    return (
        <div>
            <KeyUnit label="spc" hitProgresses={[
                (MS_PER_BEAT - msSinceLastBeat) / HITRING_DURATION,
                (MS_PER_BEAT - msSinceLastBeat + MS_PER_BEAT) / HITRING_DURATION,
                (MS_PER_BEAT - msSinceLastBeat + MS_PER_BEAT + MS_PER_BEAT) / HITRING_DURATION,
            ]} />
        </div>
    );
}