import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface CustomTooltipInterface {
    trigger: React.ReactNode;
    content: React.ReactNode;
    side?: "top" | "bottom" | "left" | "right";
}

const CustomTooltip: React.FC<CustomTooltipInterface> = ({
    trigger,
    content,
    side = "top",
}) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side={side}>{content}</TooltipContent>
        </Tooltip>
    );
};

export default CustomTooltip;
