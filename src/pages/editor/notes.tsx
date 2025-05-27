import { KeyUnit } from "../../components/key-unit";
import KeyboardLayout from "../../components/keyboard-layout";

export default function Notes() {

    return (
        <KeyboardLayout keyComponent={key => <KeyUnit > {key} </KeyUnit>} />
    );
}