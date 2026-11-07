import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
                d="M18 24V16C18 8.268 24.268 2 32 2C39.732 2 46 8.268 46 16V24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
            />
            <path
                d="M12 24H52L48 56H16L12 24Z"
                fill="currentColor"
            />
            <path
                d="M22 28H42V48H22V28Z"
                fill="#E8E8E8"
                opacity="0.18"
            />
            <text
                x="32"
                y="42"
                textAnchor="middle"
                fontSize="18"
                fontWeight="900"
                fill="#1D4ED8"
                fontFamily="Arial, Helvetica, sans-serif"
            >
                M3
            </text>
        </svg>
    );
}
