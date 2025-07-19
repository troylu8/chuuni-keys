import { Music } from "lucide-react";
import { useBgmState } from "../contexts/bgm-state";

export default function NowPlaying() {
    const {} = useBgmState();
    
    return (
        <div className="fixed bottom-0 right-[5vw] flex gap-3 font-mono">
            <Music />
            
            <p> now playing:  </p>
        </div>
    );
}