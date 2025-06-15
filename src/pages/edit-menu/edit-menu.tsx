import { Page, usePage } from "../../providers/page";

export default function EditMenu() {
    const [,setPageParams] = usePage();
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-5">
            <button onClick={() => setPageParams([Page.SONG_SELECT, { isEditing: true }])}> edit existing chart </button>
            
            <p> or </p>
            
            <div className="
                outline-dashed outline-2 w-48 h-32 rounded-lg
                flex justify-center items-center
            ">
                <span className="text-center"> drag audio file here to create new chart </span>
            </div>
            
            <button 
                onClick={() => setPageParams([Page.MAIN_MENU])}
                className="mt-5"
            > back to main menu </button>
        </div>
    );
}