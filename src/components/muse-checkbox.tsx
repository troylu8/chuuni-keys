import { Bind } from "../lib/lib";
import { CenteredCheckIcon } from "./icons";

type Props = Readonly<{
    label: string
    bind: Bind<boolean>
}>
export default function MuseCheckbox({ label, bind: [checked, setter] }: Props) {
    
    return (
        <div 
            className="flex items-center gap-3 cursor-pointer hover:[&>div]:outline-ctp-pink hover:[&>div]:text-ctp-pink" 
            onClick={() => setter(!checked)}
        >
            <div className={`
                w-5 h-5 outline-2 rounded-md
                flex justify-center items-center 
                ${checked && "outline-ctp-red text-ctp-red"}
                
            `}>
                { checked && <CenteredCheckIcon size="85%" /> }
            </div>
            
            <span> {label} </span>
        </div>
    );
}