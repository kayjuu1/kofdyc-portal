import {useRouter} from "@tanstack/react-router";
import {Button} from "@/components/ui/button.tsx";

const NotFound = () => {
    const router = useRouter();

    return (
        <div
            className="min-h-screen bg-linear-to-br from-background to-muted flex flex-col items-center justify-center p-6 text-center">
            {/* Decorative SVG - slightly enlarged and with subtle bounce */}
            <div className="mb-8 animate-bounce-slow">
                <img
                    src="/ssshape.svg"
                    alt="Abstract brand shape"
                    className="h-56 w-auto md:h-80 opacity-90"
                />
            </div>

            {/* Main Content */}
            <div className="space-y-4 max-w-md">
                <h1 className="text-6xl md:text-7xl font-black tracking-tight bg-clip-text text-primary">
                    404
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Oops! Page Not Found
                </h2>
                <p className="text-muted-foreground text-lg">
                    The page you’re looking for doesn’t exist or has been moved.
                </p>

                <div className="pt-4">
                    <Button
                        onClick={() => router.history.back()}
                        variant="default"
                        size="lg"
                        className="px-6 py-2 text-base"
                    >
                        ← Go Back
                    </Button>
                </div>
            </div>

            {/* Optional: Add a soft decorative element in the background (optional) */}
            <div className="absolute top-1/4 left-10 w-32 h-32 rounded-full bg-primary/5 blur-xl"></div>
            <div className="absolute bottom-1/4 right-10 w-40 h-40 rounded-full bg-rose-500/5 blur-xl"></div>
        </div>
    );
};

export default NotFound;