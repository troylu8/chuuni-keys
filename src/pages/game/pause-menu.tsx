import { useEffect } from "react";
import { useGameControls } from "../../providers/game-manager";
import { usePlayback } from "../../providers/playback";

export default function PauseMenu() {
    const { playing, setPlaying } = usePlayback();
    const [ restartGame, stopGame ] = useGameControls();
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setPlaying(!playing)
        }
        
        window.addEventListener("keydown", handleKeyDown);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, [playing]);
    
    return (
        <>
            { !playing && 
                <div className="absolute cover flex flex-col justify-center items-center gap-3 z-20">
                    <button onClick={() => setPlaying(true)}> resume </button>
                    <button onClick={restartGame}> restart </button>
                    <button onClick={stopGame}> quit </button>
                </div>
            }
        </>
    )
}