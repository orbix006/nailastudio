'use client';

import * as React from 'react';
import Image, { ImageProps } from 'next/image';

const PREMIUM_PLACEHOLDER = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80';

export function SafeImage({ src, alt, onError, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = React.useState<ImageProps['src']>(src);

  React.useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc || PREMIUM_PLACEHOLDER}
      alt={alt}
      onError={(e) => {
        setImgSrc(PREMIUM_PLACEHOLDER);
        if (onError) onError(e);
      }}
    />
  );
}
