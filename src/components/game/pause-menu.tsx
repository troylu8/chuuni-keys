import { useEffect } from "react";
import { useGameControls } from "../../providers/game-state";

export default function PauseMenu() {
    const [paused, togglePauseGame, stopGame] = useGameControls();
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") togglePauseGame(); 
        }
        
        window.addEventListener("keydown", handleKeyDown);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, [paused]);
    
    return (
        <>
            { paused && 
                <div className="absolute cover z-10 flex flex-col justify-center items-center gap-3">
                    <button onClick={togglePauseGame}> resume </button>
                    <button onClick={stopGame}> quit </button>
                </div>
            }
        </>
    )
}