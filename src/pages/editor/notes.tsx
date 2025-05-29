import { Tree } from "functional-red-black-tree";
import { KeyUnit } from "../../components/key-unit";
import KeyboardLayout from "../../components/keyboard-layout";
import { ACTIVATION_DURATION, HITRING_DURATION, MuseEvent } from "../../providers/game-manager";

type Props = Readonly<{
    events: Tree<number, MuseEvent>
    position: number
}>
export default function Notes({ events, position }: Props) {
    
    const visibleProgresses: Record<string, number[]> = {};
    events?.forEach(
        (hitTime, event) => {
            if (event[1].startsWith(":")) {
                const key = event[1].substring(1);
                const progress = (hitTime - position) / HITRING_DURATION;
                if (visibleProgresses[key]) {
                    visibleProgresses[key].push(progress);
                }
                else {
                    visibleProgresses[key] = [progress];
                }
            }
        },
        position, position + ACTIVATION_DURATION    
    );
    
    return (
        <KeyboardLayout keyComponent={key => <KeyUnit key={key} label={key} hitProgresses={visibleProgresses[key] ?? []} />} />
    );
}