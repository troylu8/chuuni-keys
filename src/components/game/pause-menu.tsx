import { useEffect } from "react";
import { usePlayback } from "../../providers/playback";

export default function PauseMenu() {
    const [paused, togglePaused] = usePlayback();
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") togglePaused(); 
        }
        
        window.addEventListener("keydown", handleKeyDown);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, []);
    
    return (
        <>
            { paused && 
                <div 
                    className="
                        absolute left-0 right-0 top-0 bottom-0 z-10
                        flex flex-col justify-center items-center gap-3
                    "
                >
                    <button> resume </button>
                    <button> restart </button>
                    <button> quit </button>
                </div>
            }
        </>
    )
}