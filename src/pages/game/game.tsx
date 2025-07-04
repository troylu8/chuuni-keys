import GameManager, { GameStage, useGameStage as useGameStage } from "../../providers/game-manager";
import DeltaProvider from "../../providers/score";
import AccuracyBar from "../../components/accuracy-bar";
import KeyboardLayout from "../../components/keyboard-layout";
import PauseModal from "./pause-modal";
import Background from "../../components/background";
import Combo from "./combo";
import Results from "./results";
import KeyUnitGame from "./key-unit-game";
import { ChartMetadata, usePage } from "../../providers/page";
import { getChartFolder } from "../../lib/globals";

export default function Game() {
    return (
        <GameManager>
            <GameInner />
        </GameManager>
    );
}

function GameInner() {
    const [gameStage] = useGameStage();
    const [[, params]] = usePage();
    const metadata = params as ChartMetadata;

    return (
        <div className="fixed cover">
            <Background imgPath={metadata.img_ext && `${getChartFolder(metadata)}\\img.${metadata.img_ext}`} />
            { gameStage == GameStage.LOADING && <p> loading... </p> }
            
            <DeltaProvider>
                { gameStage == GameStage.STARTED &&
                    <>
                        <KeyboardLayout keyComponent={key => 
                            <KeyUnitGame 
                                key={key} 
                                keyCode={key} 
                                museEvent={":" + key}    
                            >
                                { key }
                            </KeyUnitGame>
                        } />
                        
                        <PauseModal />
                        <Combo />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[5vh]">
                            <AccuracyBar />
                        </div>
                    </>
                }
                { gameStage == GameStage.ENDED && <Results /> }
            </DeltaProvider>
        </div>
    )
}