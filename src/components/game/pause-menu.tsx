import { useEffect } from "react";
import { useGameControls } from "../../providers/game-state";

export default function PauseMenu() {
    const [playing, togglePauseGame, restartGame, stopGame] = useGameControls();
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") togglePauseGame(); 
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
                    <button onClick={togglePauseGame}> resume </button>
                    <button onClick={restartGame}> restart </button>
                    <button onClick={stopGame}> quit </button>
                </div>
            }
        </>
    )
}