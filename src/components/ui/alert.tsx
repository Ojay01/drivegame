import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

// Utility function for conditional class names
const cn = (...inputs: any[]) => {
  return inputs
    .filter(Boolean)
    .map((input) => (typeof input === 'string' ? input : Object.keys(input).filter(key => input[key])))
    .flat()
    .join(' ')
}

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~div]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-900 border-gray-200 dark:bg-gray-950 dark:text-gray-50 dark:border-gray-800",
        destructive:
          "border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500 bg-red-50",
        success: 
          "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-500 bg-green-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export {
  Alert,
  AlertTitle,
  AlertDescription,
}