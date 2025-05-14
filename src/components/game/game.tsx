import GameStateProvider from "../../providers/game-state";
import DeltaProvider from "../../providers/delta";
import AccuracyBar from "./accuracy-bar";
import Keyboard from "./keyboard";
import PauseMenu from "./pause-menu";

export default function Game() {
    
    return (
        <GameStateProvider>
            <div className="fixed left-0 right-0 top-10 bottom-0">
                <PauseMenu />
                <DeltaProvider>
                    <Keyboard />
                    <AccuracyBar />
                </DeltaProvider>
            </div>
        </GameStateProvider>
    );
}