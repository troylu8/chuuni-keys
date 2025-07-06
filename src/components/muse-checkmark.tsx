import { Bind } from "../lib/globals";
import { CenteredCheckIcon } from "./icons";

type Props = Readonly<{
    label: string
    bind: Bind<boolean>
}>
export default function MuseCheckmark({ label, bind: [checked, setter] }: Props) {
    
    return (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setter(!checked)}>
            <div className={`
                w-5 h-5 outline-2 outline-foreground rounded-md
                flex justify-center items-center 
                ${checked ? "bg-foreground text-background" : "bg-background text-foreground"}
            `}>
                { checked && <CenteredCheckIcon size="85%" /> }
            </div>
            
            <label> {label} </label>
        </div>
    );
}