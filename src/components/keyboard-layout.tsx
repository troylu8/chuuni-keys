import { ReactNode } from "react";

const KEYBOARD_LAYOUT = [
    // "z".split("")
    "qwertyuiop".split(""),
    "asdfghjkl".split(""),
    "zxcvbnm,".split("")
]

type Props = Readonly<{
    keyComponent: (key: string) => ReactNode
}>
export default function KeyboardLayout({keyComponent}: Props) {
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-5 z-10">
            {
                KEYBOARD_LAYOUT.map((row, i) => 
                    <div key={i} className="flex gap-3">
                        { row.map(key => keyComponent(key)) }
                    </div>
                )
            }
        </div>
    );
}