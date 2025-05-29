import { Page, usePage } from "../../providers/page";
import { useSettings } from "../../providers/settings";

export default function Settings() {
    const [_, setPageParams] = usePage();
    const [settings, setSettings] = useSettings(); 
    
    return (
        <div className="absolute cover flex flex-col gap-3 p-3">
            <button onClick={() => setPageParams([Page.MAIN_MENU])}> back to main menu </button>
            <h1> settings </h1>
            <button > adjust custom offset { settings.offset } </button>
            <p>{settings.activation_duration}</p>
            <p>{settings.hitring_duration}</p>
        </div>
    );
}