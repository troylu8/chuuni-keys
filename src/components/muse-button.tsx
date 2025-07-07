type Props = Readonly<{
    children: React.ReactNode
    className?: string 
    onClick?: () => any
}>
export default function MuseButton({ className, children, onClick }: Props) {
    
    return (
        <button
            tabIndex={-1}
            onClick={e => {
                e.currentTarget.blur(); // prevent keyboard focus
                if (onClick) onClick();
            }}
            className={`px-2 text-background bg-foreground rounded-md ${className}`}
        >
            { children }
        </button>
    )
}