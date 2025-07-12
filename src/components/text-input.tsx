import { KeyboardEvent } from "react";
import { Bind } from "../lib/lib";

type Props = {
    bind: Bind<string>
    valid?: boolean,
    className?: string
    placeholder?: string
    maxChars?: number
    onSubmit?: () => any
    label?: string
};
export default function TextInput({
    bind,
    valid = true,
    className,
    placeholder,
    maxChars,
    onSubmit,
}: Props) {
    let [text, setText] = bind;
    
    const showCharLimit = maxChars != undefined && text.length > maxChars - 10;
    const limitExceeded = maxChars != undefined && text.length > maxChars;
    
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (onSubmit && e.key === "Enter" && !limitExceeded) onSubmit()
    }
    
    return (
        <div className="relative grow">
            <input
                spellCheck={false}
                placeholder={placeholder}
                onInput={(e) => setText(e.currentTarget.value) }
                className={`${className} w-full rounded-lg outline-0 ${showCharLimit && "pr-15"} border-2 p-1 ${valid ? "border-ctp-mauve" : "border-ctp-red text-ctp-red" }`}
                value={text}
                onKeyDown={handleKeyDown}
            />
            {   showCharLimit && 
                <p className={`
                    absolute right-2 top-1/2 -translate-y-1/2 
                    bg-background ${limitExceeded && "text-failure"} rounded-md px-1
                    text-sm
                `}>
                    {text.length}/{maxChars}
                </p>
            }
        </div>
    );
}