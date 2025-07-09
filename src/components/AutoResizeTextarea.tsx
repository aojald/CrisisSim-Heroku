import React, { useEffect, useRef } from 'react';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export default function AutoResizeTextarea({ value, onChange, className = '', ...props }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    adjustHeight();
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      className={`resize-none overflow-hidden ${className}`}
      rows={1}
      {...props}
    />
  );
}