import { ReactNode } from "react";

export const KEY_SIZE = "7vw";

// https://hirosarts.com/blog/keycap-dimensions-guide-for-beginners/
const ANSI_STAGGER = [
    1.5,     // tab key is 1.5u wide
    1.75,    // capslock key is 1.75u wide
    2.25,    // left shift key is (probably) 2.25u wide 
];

const QWERTY = [
    // "q".split("")
    "qwertyuiop".split(""),
    "asdfghjkl".split(""),
    "zxcvbnm,".split("")
];

type Props = Readonly<{
    keyComponent: (key: string) => ReactNode
}>
export default function KeyboardLayout({keyComponent}: Props) {
    return (
        <div className="absolute cover z-10">
            <div className="flex flex-col gap-[3vw] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {
                    QWERTY.map((row, i) => 
                        <div 
                            key={i} 
                            className="flex gap-[2vw]" 
                            style={{marginLeft: `calc(${KEY_SIZE} * (${ANSI_STAGGER[i] - ANSI_STAGGER[0]}))`}}
                        >
                            { row.map(key => keyComponent(key)) }
                        </div>
                    )
                }
            </div>
        </div>
    );
}