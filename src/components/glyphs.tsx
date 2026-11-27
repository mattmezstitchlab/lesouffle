import { embedUrlOf } from './visual-utils';

export function Visual({
  src,
  type = 'image',
  alt,
  className = '',
  controls = false,
}: {
  src: string;
  type?: 'image' | 'video';
  alt: string;
  className?: string;
  controls?: boolean;
}) {
  if (type === 'video' || !!embedUrlOf(src) || /^data:video\//i.test(src) || /\.(mp4|webm|ogg|mov)(?:[?#]|$)/i.test(src)) {
    const embed = embedUrlOf(src);
    if (embed) {
      return (
        <iframe
          src={embed}
          title={alt}
          className={`${className} ${controls ? '' : 'pointer-events-none'}`}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen={controls}
          loading="lazy"
        />
      );
    }
    return (
      <video
        src={src}
        className={`${className} ${controls ? '' : 'pointer-events-none'}`}
        controls={controls}
        autoPlay={!controls}
        muted
        loop={!controls}
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

export function Asterisk({ className = 'h-[0.62em] w-[0.62em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`inline-block shrink-0 align-baseline ${className}`}>
      <g stroke="currentColor" strokeWidth="3.1" strokeLinecap="round">
        <path d="M12 1.5v21" />
        <path d="M3.8 5.6l16.4 12.8" />
        <path d="M20.2 5.6L3.8 18.4" />
      </g>
    </svg>
  );
}

export function Sparkle({ className = 'h-[0.55em] w-[0.55em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`inline-block shrink-0 align-baseline ${className}`}>
      <path fill="currentColor" d="M12 0 Q13.6 10.4 24 12 Q13.6 13.6 12 24 Q10.4 13.6 0 12 Q10.4 10.4 12 0 Z" />
    </svg>
  );
}

export function Dot({ className = 'h-[0.32em] w-[0.32em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" className={`inline-block shrink-0 align-baseline ${className}`}>
      <circle cx="5" cy="5" r="5" fill="currentColor" />
    </svg>
  );
}

export function SplitTitle({ text, className = '' }: { text: string; className?: string }) {
  const words = text.toUpperCase().split(' ');
  const cut = Math.max(1, Math.ceil(words.length * 0.55));
  return (
    <span className={className}>
      {words.slice(0, cut).join(' ')}{' '}
      <span className="text-fog">{words.slice(cut).join(' ')}</span>
    </span>
  );
}
