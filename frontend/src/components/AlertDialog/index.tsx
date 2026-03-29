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

export interface AlertDialogInterface {
    trigger: React.ReactNode;
    onActionLabel: string;
    onAction: () => void;
    size?: "default" | "sm";
    dialogLabel?: string;
    description?: string;
    isCritical?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onCancel?: () => void;
    children?: React.ReactNode;
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
    onOpenChange,
    onAction,
    onCancel,
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
                    <AlertDialogCancel variant="outline" onClick={onCancel}>
                        Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant={isCritical ? "destructive" : "default"}
                        onClick={onAction}
                    >
                        {onActionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default Dialog;
