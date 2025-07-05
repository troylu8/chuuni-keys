import { useEffect } from "react";
import { useGameControls } from "../../contexts/game-manager";
import Modal from "../../components/modal";
import MuseButton from "../../components/muse-button";
import { useBgmState } from "../../contexts/bgm-state";
import bgm from "../../lib/sound";

export default function PauseModal() {
    const { paused } = useBgmState();
    const [ restartGame, stopGame ] = useGameControls();
    
    // toggle with esc key
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                bgm.paused? bgm.play() : bgm.pause();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => { window.removeEventListener("keydown", handleKeyDown); }
    }, []);
    
    return (
        <>
            { paused && 
                <Modal title="paused">
                    <div className="flex flex-col gap-3 p-2">
                        <MuseButton onClick={bgm.play}> resume </MuseButton>
                        <MuseButton onClick={restartGame}> restart </MuseButton>
                        <MuseButton onClick={stopGame}> quit </MuseButton>
                    </div>
                </Modal>
            }
        </>
    )
}