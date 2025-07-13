import { Sparkle } from "lucide-react";

export default function LoadingSpinner() {

    return (
        <div className="w-8 h-8 relative">
            <Sparkle 
                className="absolute left-1/2 top-1/2 -translate-1/2 anim-loading"
                size="100%" 
                fill="var(--color-ctp-mauve)" 
                color="var(--color-ctp-mauve)" 
            />
        </div>
    );
}