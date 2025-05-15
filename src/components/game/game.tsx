import GameStateProvider from "../../providers/game-state";
import DeltaProvider from "../../providers/delta";
import AccuracyBar from "./accuracy-bar";
import Keyboard from "./keyboard";
import PauseMenu from "./pause-menu";

export default function Game() {
    
    return (
        <GameStateProvider>
            <div className="fixed cover">
                <PauseMenu />
                <DeltaProvider>
                    <Keyboard />
                    <AccuracyBar />
                </DeltaProvider>
            </div>
        </GameStateProvider>
    );
}