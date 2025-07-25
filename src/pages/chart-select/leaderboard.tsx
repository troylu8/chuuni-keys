import { useState, useEffect, useRef } from "react";
import { ChartMetadata, resetAnimation } from "../../lib/lib";
import { LeaderboardEntry, getLeaderboard } from "../game/results-screen";
import MuseButton from "../../components/muse-button";
import { Sparkle, XIcon } from "lucide-react";
import { useOnBeat } from "../../lib/sound";

type LeaderboardProps = Readonly<{
    chart: ChartMetadata
    onClose: () => any
}>
export default function Leaderboard({ chart, onClose }: LeaderboardProps) {
    
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    
    useEffect(() => { getLeaderboard(chart).then(setEntries) }, [chart]);
    
    function formatDate(ms: number) {
        
        // if its within 2 minutes, show "now"
        if (Date.now() - ms < 1000 * 60 * 2) return "now";
        
        const today = new Date();
        const then = new Date(ms);
        
        if (
            today.getDate() === then.getDate() && 
            today.getMonth() === then.getMonth() &&
            today.getFullYear() === then.getFullYear()
        ) {
            return "today";
        }
        
        const year = then.getFullYear();
        const month = (1 + then.getMonth()).toString().padStart(2, '0');
        const day = then.getDate().toString().padStart(2, '0');
        return month + '/' + day + '/' + year;
    }
    
    const entriesContRef = useRef<HTMLDivElement | null>(null);
    const beatDuration = useOnBeat(beat => {
        const entriesCont = entriesContRef.current;
        if (!entriesCont) return;
        resetAnimation(entriesCont.children[beat % entriesCont.children.length] as HTMLElement);
    });
    
    return (
        <div className="fixed left-1/2 right-0 top-1/2 -translate-y-1/2 h-[80vh] overflow-auto p-[3vw]">
            <header className="flex justify-between text-[5vh]">
                <h2 className="flex items-center"> <Sparkle fill="var(--color-ctp-mauve)" /> &nbsp; Leaderboard </h2>
                <MuseButton className="text-ctp-red w-[1em] h-[1em] p-0!" onClick={onClose}> <XIcon size="100%" /> </MuseButton>
            </header>
            <div 
                ref={entriesContRef} 
                className="flex flex-col mt-[5vh] gap-[3vh]"
            >
                { entries.length == 0 &&
                    <p 
                        style={{animationDuration: beatDuration ? beatDuration + "ms" : ""}}    
                        className="anim-flash mx-auto font-mono text-[4vh]"
                    > [ no scores yet ] </p>
                }
                { entries.map(entry => 
                    <div 
                        key={entry.timestamp} 
                        style={{animationDuration: beatDuration ? beatDuration + "ms" : ""}}  
                        className="anim-flash relative flex text-[4vh] font-mono gap-[3vh]"
                    >
                        
                        {/* letter diamond */}
                        <div 
                            style={{backgroundColor: `var(--${entry.letter})`}}
                            className="
                                absolute left-0 top-1/2 -translate-y-1/2 
                                w-[5vh] h-[5vh] rotate-45 rounded-[25%]
                                flex justify-center items-center z-10
                            "
                        >
                            <p className="-rotate-45 text-ctp-base font-serif"> 
                                { entry.letter } 
                            </p>
                        </div>
                        
                        <span className="ml-[8vh]"> { entry.accuracyPercent }% </span>
                        <span className="text-ctp-blue"> {entry.maxCombo}x </span>
                        <span className="text-ctp-blue"> {entry.fullCombo ? "FC" : ""} </span>
                        
                        <span className="ml-auto text text-ctp-mauve"> {formatDate(entry.timestamp)} </span>
                    </div>
                )}
            </div>
        </div>
    );
}