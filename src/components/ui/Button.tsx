import { ComponentPropsWithoutRef } from "react";
import { cva, VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost"
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

interface ButtonProps extends ComponentPropsWithoutRef<typeof motion.button>, VariantProps<typeof buttonVariants> {}

export default function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={buttonVariants({ variant, className })}
      {...props}
    />
  );
}