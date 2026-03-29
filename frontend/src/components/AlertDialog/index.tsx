import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Loader2 } from "lucide-react";

export interface AlertDialogInterface {
    trigger: React.ReactNode;
    onActionLabel: string;
    onAction: () => void;
    size?: "default" | "sm";
    dialogLabel?: string;
    description?: string;
    isCritical?: boolean;
    open?: boolean;
    isLoading?: boolean;
    children?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
}

const Dialog: React.FC<AlertDialogInterface> = ({
    trigger,
    size = "default",
    description,
    isCritical = false,
    dialogLabel,
    onActionLabel,
    children,
    open,
    isLoading,
    onOpenChange,
    onAction,
}) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent size={size}>
                {(dialogLabel || description) && (
                    <AlertDialogHeader>
                        {dialogLabel && (
                            <AlertDialogTitle>{dialogLabel}</AlertDialogTitle>
                        )}
                        {description && (
                            <AlertDialogDescription>
                                {description}
                            </AlertDialogDescription>
                        )}
                    </AlertDialogHeader>
                )}
                {children && <div>{children}</div>}
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline" disabled={isLoading}>
                        Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant={isCritical ? "destructive" : "default"}
                        onClick={(e) => {
                            if (isLoading !== undefined) e.preventDefault();
                            onAction();
                        }}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        {onActionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default Dialog;
