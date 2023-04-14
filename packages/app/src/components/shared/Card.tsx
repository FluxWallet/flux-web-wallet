interface CardProps {
  children: React.ReactNode;
  className?: string;
  width?: string;
  height?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
}) => (
  <div className={`bg-white rounded-t-[32px] rounded-b-[28px] flex-1 flex flex-col justify-start p-6 relative ${className}`}>
    <div className="w-full h-full flex flex-col justify-between">
      {children}
    </div>
  </div>
);

