import KeyUnit from "./key-unit";

export default function Keyboard() {
    return (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">
            <KeyUnit keyCode=" " hitringEvent=":space"> spc </KeyUnit>
        </div>
    );
}