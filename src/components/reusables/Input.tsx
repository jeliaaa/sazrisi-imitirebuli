import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, value, ...rest }, ref) => {
    return (
        <div className="w-1/2 flex flex-col">
            <label className="text-7xl font-medium text-center text-main-color">
                <span className="text-7xl text-center">{label}</span>
            </label>
            <input
                ref={ref}
                value={value ?? ''}
                className="mt-2 px-3 py-2 h-30 text-7xl borderrounded-md text-md text-main-color shadow-sm text-center focus:outline-none ring-2 ring-main-color border-main-color"
                {...rest}
            />
        </div>
    );
});

Input.displayName = "Input";

export default Input;
