import KeyUnit from "./key-unit";

export default function Keyboard() {
    return (
        <div className="absolute cover flex justify-center items-center gap-5">
            <KeyUnit keyCode="z" hitringEvent=":z"> z </KeyUnit>
            <KeyUnit keyCode="x" hitringEvent=":x"> x </KeyUnit>
            <KeyUnit keyCode="c" hitringEvent=":c"> c </KeyUnit>
        </div>
    );
}