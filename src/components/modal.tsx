import MuseButton from "./muse-button";

type Props = Readonly<{
    onClose?: () => any
    title: string,
    children: React.ReactNode
}>
export default function Modal({ onClose, title, children }: Props) {
    
    let mousePressed = false;
    
    function handleClose() {
        mousePressed = false;
        if (onClose) onClose();
    }

    return (
        <div
            className="fixed cover flex flex-col justify-center items-center bg-[#1e1e1e88] z-50"
            onMouseDown={e => { if (e.target === e.currentTarget) mousePressed = true }}
            onMouseUp={(e) => { if (e.target === e.currentTarget && mousePressed) handleClose() }}
        >
            <div className="max-h-[80%] bg-background rounded-md flex flex-col outline-3 outline-foreground">
                <div className="flex justify-between p-2">
                    <h1 className={`text-nowrap ${onClose == undefined && "w-full text-center"}`}>
                        {title}
                    </h1>
                    
                    { onClose && <MuseButton onClick={handleClose}> x </MuseButton> }
                </div>
                
                <div className="overflow-auto">
                    { children }
                </div>
            </div>
        </div>
    );
}