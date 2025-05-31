type Props = Readonly<{
    children: React.ReactNode
    onClick?: () => any
}>
export default function MuseButton({ children, onClick }: Props) {
    return (
        <button 
            onClick={onClick} 
            className="px-2 text-background bg-foreground rounded-md"
        >
            { children }
        </button>
    )
}