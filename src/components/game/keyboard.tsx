import KeyUnit from "./key-unit";

const KEYBOARD_LAYOUT = [
    "qwertyuiop".split(""),
    "asdfghjkl".split(""),
    "zxcvbnm,".split("")
]


export default function Keyboard() {
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-5 z-10">
            {
                KEYBOARD_LAYOUT.map((row, i) => 
                    <div 
                        key={i}
                        className="flex gap-3"
                    >
                        {
                            row.map(key => 
                                <KeyUnit key={key} keyCode={key} hitringEvent={":" + key}> {key} </KeyUnit>
                            )
                        }
                    </div>
                )
            }
        </div>
    );
}