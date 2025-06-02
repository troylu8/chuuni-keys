import GameManager, { GameStage, useGameStage as useGameStage } from "../../providers/game-manager";
import DeltaProvider from "../../providers/score";
import AccuracyBar from "../../components/accuracy-bar";
import KeyboardLayout from "../../components/keyboard-layout";
import PauseMenu from "./pause-menu";
import Background from "../../components/background";
import Combo from "./combo";
import Results from "./results";
import KeyUnitGame from "./key-unit-game";

export default function Game() {
    return (
        <GameManager>
            <GameInner />
        </GameManager>
    );
}

function GameInner() {
    const [gameStage] = useGameStage();
    
    return (
        <div className="fixed cover">
            <Background />
            { gameStage == GameStage.LOADING && <p> loading... </p> }
            
            <DeltaProvider>
                { gameStage == GameStage.STARTED &&
                    <>
                        <PauseMenu />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-3">
                            <AccuracyBar />
                        </div>
                        <Combo />
                        
                        <KeyboardLayout keyComponent={key => 
                            <KeyUnitGame 
                                key={key} 
                                keyCode={key} 
                                museEvent={":" + key}    
                            >
                                { key }
                            </KeyUnitGame>
                        } />
                    </>
                }
                { gameStage == GameStage.ENDED && <Results /> }
            </DeltaProvider>
        </div>
    )
}