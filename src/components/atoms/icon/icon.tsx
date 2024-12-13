import React from 'react';

// Define the prop types for the IconAtom component
interface IconAtomProps {
  icon: string; // The name of the icon (e.g., 'search', 'expand_more')
  className?: string; // Optional additional classes
  size?: 'small' | 'medium' | 'large'; // Optional size variant
  color?: string; // Optional color class or custom color
  onClick?: () => void; // Optional click handler
}

// Mapping of size variants to Tailwind classes
const sizeVariants = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg'
};

const IconAtom: React.FC<IconAtomProps> = ({
  icon, 
  className = '', 
  size = 'medium',
  color = 'text-current',
  onClick
}) => {
  // Combine size, color, and any additional classes
  const combinedClasses = `material-icons ${sizeVariants[size]} ${color} ${className} ${onClick ? 'cursor-pointer' : ''}`.trim();

  return (
    <span 
      className={combinedClasses} 
      onClick={onClick}
    >
      {icon}
    </span>
  );
};

export default IconAtom;

