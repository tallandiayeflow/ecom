import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download } from "lucide-react";

export const InstallPWA = () => {
    const { isInstallable, installPWA } = usePWAInstall();

    if (!isInstallable) return null;

    return (
        <Button
            onClick={installPWA}
            variant="outline"
            size="sm"
            className="hidden md:flex gap-2 items-center bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded-xl"
        >
            <Download className="h-4 w-4" />
            Installer l'App
        </Button>
    );
};
