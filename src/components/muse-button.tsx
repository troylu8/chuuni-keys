type Props = Readonly<{
    children: React.ReactNode
    className?: string 
    onClick?: () => any
}>
export default function MuseButton({ className, children, onClick }: Props) {
    return (
        <button 
            onClick={onClick} 
            className={`${className} px-2 text-background bg-foreground rounded-md`}
        >
            { children }
        </button>
    )
}