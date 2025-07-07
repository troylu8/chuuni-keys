import GameManager, { GameStage, useGameStage as useGameStage } from "../../contexts/game-manager";
import DeltaProvider from "../../contexts/score";
import AccuracyBar from "../../components/accuracy-bar";
import KeyboardLayout from "../../components/keyboard-layout";
import PauseModal from "./pause-modal";
import Background from "../../components/background";
import Combo from "./combo";
import Results from "./results";
import KeyUnitGame from "./key-unit-game";
import { usePage } from "../../contexts/page";
import { ChartMetadata, getChartFolder } from "../../lib/lib";
import { useSettings } from "../../contexts/settings";
import Praise from "../../components/praise";

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
    const [{showCombo, showAccuracyBar}] = useSettings();

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
                        { showCombo && <Combo /> }
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[5vh]">
                            { showAccuracyBar && <AccuracyBar /> }
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-[7vh]">
                                <Praise />
                            </div>
                        </div>
                    </>
                }
                { gameStage == GameStage.ENDED && <Results /> }
            </DeltaProvider>
        </div>
    )
}