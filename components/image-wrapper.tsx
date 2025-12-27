import React from 'react';

interface ImageWrapperProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const ImageWrapper: React.FC<ImageWrapperProps> = ({ src, alt, width, height, className }) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
};

export default ImageWrapper;
