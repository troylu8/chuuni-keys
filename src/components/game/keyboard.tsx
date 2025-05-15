import KeyUnit from "./key-unit";

export default function Keyboard() {
    return (
        <div className="absolute cover flex justify-center items-center">
            <KeyUnit keyCode=" " hitringEvent=":space"> spc </KeyUnit>
        </div>
    );
}