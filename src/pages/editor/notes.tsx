import { Tree } from "functional-red-black-tree";
import { KeyUnit } from "../../components/key-unit";
import KeyboardLayout from "../../components/keyboard-layout";
import { ACTIVATION_DURATION, MuseEvent } from "../../providers/game-manager";

type Props = Readonly<{
    events: Tree<number, MuseEvent>
    position: number
}>
export default function Notes({ events, position }: Props) {
    
    const visibleEvents = events?.forEach(
        (key, value) => {
            
        },
        position, position + ACTIVATION_DURATION    
    );
    
    return (
        <KeyboardLayout keyComponent={key => <KeyUnit > {key} </KeyUnit>} />
    );
}