import React from "react";

interface CutRightIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    color?: string;
    strokeWidth?: number;
}

const CutRightIcon: React.FC<CutRightIconProps> = ({
    size = 24,
    color = "currentColor",
    strokeWidth = 2,
    ...props
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <line x1={3} y1={3} x2={3} y2={21} />
            <line x1={3} y1={21} x2={21} y2={21} />
            <line x1={21} y1={3} x2={21} y2={21} strokeDasharray="4 4" />
            <line x1={3} y1={3} x2={21} y2={3} />
            <circle cx={8.5} cy={8.5} r={1.5} />
            <line x1={9.56066} y1={9.56066} x2={12} y2={12} />
            <line x1={17} y1={17} x2={14.82} y2={14.82} />
            <circle cx={8.5} cy={15.5} r={1.5} />
            <line x1={9.56066} y1={14.43934} x2={17} y2={7} />
        </svg>
    );
};

export default CutRightIcon;
