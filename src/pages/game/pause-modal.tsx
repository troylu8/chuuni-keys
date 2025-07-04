import { useEffect } from "react";
import { useGameControls } from "../../providers/game-manager";
import { usePlayback } from "../../providers/playback";
import Modal from "../../components/modal";
import MuseButton from "../../components/muse-button";

export default function PauseModal() {
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
                <Modal title="paused">
                    <div className="flex flex-col gap-3 p-2">
                        <MuseButton onClick={() => setPlaying(true)}> resume </MuseButton>
                        <MuseButton onClick={restartGame}> restart </MuseButton>
                        <MuseButton onClick={stopGame}> quit </MuseButton>
                    </div>
                </Modal>
            }
        </>
    )
}