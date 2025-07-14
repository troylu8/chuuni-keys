import { useEffect } from "react";
import { useGameControls } from "../../contexts/game-manager";
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
                <div className="
                    absolute cover flex flex-col z-20 items-start pl-[20vw] bg-[#1e1e2e88]
                    font-serif tracking-widest [&>button]:text-[5vh]
                ">
                    <h1 className="mt-[15vh] text-[10vh]"> paused </h1>
                    
                    <MuseButton className="mt-[6vh]" onClick={() => bgm.play()}> resume </MuseButton>
                    <MuseButton className="ml-5" onClick={restartGame}> restart </MuseButton>
                    <MuseButton className="ml-10 text-ctp-red" onClick={stopGame}> quit stage </MuseButton>
                </div>
            }
        </>
    )
}