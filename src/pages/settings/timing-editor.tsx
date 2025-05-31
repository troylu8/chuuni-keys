import { useEffect, useState } from "react";
import { usePlayback } from "../../providers/playback";
import { useSettings } from "../../providers/settings";
import { appLocalDataDir } from "@tauri-apps/api/path";

const MS_PER_BEAT = 500;
const MS_FIRST_BEAT = 450;
const MS_LAST_BEAT = 1950;
const MS_PER_LOOP = 2000;

type Props = Readonly<{
    onClose: () => any
}>
export default function TimingEditor({ onClose }: Props) {
    const [settings, setSettings] = useSettings();
    const { getPosition, loadAudio, setPlaying } = usePlayback();
    const [tilNextBeat, setTilNextBeat] = useState(0);
    
    
    useEffect(() => {
        let intervalId: number;
        
        appLocalDataDir().then(applocaldatadir => {
            loadAudio(applocaldatadir + "\\userdata\\metronome.mp3", true);
            setPlaying(true).then(() => {
                intervalId = setInterval(() => {
                    const pos = getPosition();
                    if (pos < MS_FIRST_BEAT) 
                        setTilNextBeat(MS_FIRST_BEAT - pos);
                    else if (pos > MS_LAST_BEAT) 
                        setTilNextBeat(MS_PER_LOOP - pos + MS_FIRST_BEAT)
                    else 
                        setTilNextBeat(MS_PER_BEAT - ((pos - MS_FIRST_BEAT) % MS_PER_BEAT))
                }, 0);
            })
        });
        
        return () => { 
            if (intervalId != null) clearInterval(intervalId)
        }
    }, []);
    
    return (
        <div className="grid-cols-2">
            <Metronome tilNextBeat={tilNextBeat} />
        </div>
    );
}

type MetronomeProps = Readonly<{
    tilNextBeat: number
}>
function Metronome({ tilNextBeat }: MetronomeProps) {
    return (
        <div style={{width: (tilNextBeat / MS_PER_BEAT * 100) + "%"}} className="h-3 bg-foreground">
        </div>
    )
}