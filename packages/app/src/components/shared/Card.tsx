interface CardProps {
  children: React.ReactNode;
  width?: string;
  height?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  width = "w-[320px]",
  height = "h-[480px]",
}) => (
  <div className={`bg-white rounded-[16px] object-contain ${width} ${height} relative`}>
    <div className="flex h-full items-center justify-center px-4 inset-x-0 bottom-0">
      <div className="w-full">{children}</div>
    </div>
  </div>
);
