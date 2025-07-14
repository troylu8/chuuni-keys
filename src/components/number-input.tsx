import { ChevronLeft, ChevronRight } from "lucide-react"
import { Bind } from "../lib/lib"
import { DoubleChevronLeft, DoubleChevronRight } from "./icons"

type NumberInputProps = Readonly<{
    bind: Bind<number>
    label: string
    largeIncrements?: boolean
    min?: number
    max?: number
}>
export default function NumberInput({ bind: [value, setter], label, largeIncrements, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY }: NumberInputProps) {
    
    function clampedSetter(num: number) {
        setter(Math.max(min, Math.min(num, max)));
    }
    
    return (
        <div className="flex justify-between text-nowrap text-ctp-mauve">
            <label htmlFor={label} className="text-ctp-text"> {label} </label>
            
            <div className="flex [&>svg]:hover:text-ctp-yellow [&>svg]:hover:cursor-pointer ">
                <DoubleChevronLeft visibility={value > min && largeIncrements ? "visible" : "hidden"} size="1.5em" onClick={() => clampedSetter(value - 10)} />
                <ChevronLeft visibility={value > min ? "visible" : "hidden"} size="1.5em" onClick={() => clampedSetter(value - 1)} />
                <input 
                    id={label}
                    type="number" 
                    value={value ?? "-1"} 
                    onChange={e => clampedSetter(Number(e.currentTarget.value))}
                    className="
                        w-20 text-ctp-yellow font-mono mx-1
                        outline-2 outline-ctp-mauve rounded-sm text-center
                    "
                />
                <ChevronRight visibility={value < max ? "visible" : "hidden"} size="1.5em" onClick={() => clampedSetter(value + 1)} />
                <DoubleChevronRight visibility={value < max && largeIncrements ? "visible" : "hidden"} size="1.5em" onClick={() => clampedSetter(value + 10)} />
            </div>
        </div>
    )
}
