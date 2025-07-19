import { Pause, Play } from "lucide-react";
import { useBgmState } from "../contexts/bgm-state";
import MuseButton from "./muse-button";
import bgm from "../lib/sound";

export default function NowPlaying() {
    const { paused, title } = useBgmState();
    
    return title && (
        <div 
            style={{background: "linear-gradient(to right, #00000000, var(--color-ctp-crust) 20px)"}}
            className="
                fixed bottom-0 right-0 flex gap-3 py-1 px-8
                font-mono text-sm text-ctp-text z-50
            "
        >
            <MuseButton onClick={() => bgm.paused ? bgm.play() : bgm.pause()}>
                { paused ? <Play />  : <Pause /> }
            </MuseButton>
            
            <p> now playing: {title} </p>
        </div>
    );
}