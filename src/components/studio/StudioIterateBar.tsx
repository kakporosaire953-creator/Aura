import React, { useState } from 'react';

interface StudioIterateBarProps {
  onSubmit: (instruction: string) => void;
  isBusy?: boolean;
  placeholder?: string;
  compact?: boolean;
}

const SUGGESTIONS = [
  'Rends le design plus premium.',
  'Améliore la version mobile.',
  'Ajoute une section témoignages.',
  'Ajoute un formulaire de contact fonctionnel.',
];

export const StudioIterateBar: React.FC<StudioIterateBarProps> = ({
  onSubmit,
  isBusy = false,
  placeholder = 'Décrivez une modification : « Rends le design plus premium… »',
  compact = false,
}) => {
  const [value, setValue] = useState('');

  const submit = () => {
    const instruction = value.trim();
    if (!instruction || isBusy) return;
    onSubmit(instruction);
    setValue('');
  };

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 rounded-[16px] border border-[#E8E6DE] bg-[#FFFDF8] p-2 shadow-[0_8px_28px_rgba(20,40,45,0.05)] transition-colors focus-within:border-[#8CCB4A] dark:border-[#243337] dark:bg-[#152023] dark:focus-within:border-[#39B969]">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={compact ? 1 : 2}
          placeholder={placeholder}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] leading-relaxed text-[#14282D] outline-none placeholder:text-[#B4BCBA] dark:text-[#F3F2EC]"
          aria-label="Instruction de modification IA"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isBusy || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#078348] via-[#8CCB4A] to-[#FF790D] text-white shadow-[0_6px_18px_rgba(7,131,72,0.28)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45"
          title="Envoyer la modification"
        >
          <i className={`fa-solid ${isBusy ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-[12px]`} />
        </button>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue(s)}
              className="rounded-full border border-[#E8E6DE] bg-[#FBFAF5] px-2.5 py-[5px] text-[10.5px] text-[#77817F] transition-colors hover:border-[#8CCB4A] hover:text-[#078348] dark:border-[#243337] dark:bg-[#1B292D] dark:hover:text-[#8CCB4A]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
