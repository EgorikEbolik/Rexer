import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface DropdownItemInterface {
    label: string;
    onClick: () => void;
    isCritical?: boolean;
    icon?: React.ReactNode;
}

export interface DropdownInterface {
    trigger: React.ReactNode;
    items: DropdownItemInterface[];
    dropdownLabel?: string;
    align?: "end" | "center" | "start";
    classname?: string;
}

const Dropdown: React.FC<DropdownInterface> = ({
    trigger,
    items,
    dropdownLabel,
    align = "end",
    classname = "",
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align={align} className={classname}>
                {dropdownLabel && (
                    <DropdownMenuLabel>{dropdownLabel}</DropdownMenuLabel>
                )}
                {items.map((item) => (
                    <DropdownMenuItem
                        key={item.label}
                        onClick={item.onClick}
                        className="focus:bg-secondary"
                        variant={item.isCritical ? "destructive" : "default"}
                    >
                        {item.icon && <span className="mr-1">{item.icon}</span>}
                        {item.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Dropdown;
