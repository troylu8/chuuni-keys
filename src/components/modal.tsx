
type Props = Readonly<{
    onClose?: () => any
    title?: string,
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
            className="fixed cover flex flex-col justify-center items-center bg-[#1e1e2e88] z-50"
            onMouseDown={e => { if (e.target === e.currentTarget) mousePressed = true }}
            onMouseUp={(e) => { if (e.target === e.currentTarget && mousePressed) handleClose() }}
        >
            <div className="max-h-[80%] bg-ctp-crust rounded-md flex flex-col outline-2 outline-ctp-mauve">
                { title != undefined && 
                    <h1 className="text-nowrap w-full text-center mt-2">
                        {title}
                    </h1>
                }
                
                <div className="overflow-auto">
                    { children }
                </div>
            </div>
        </div>
    );
}