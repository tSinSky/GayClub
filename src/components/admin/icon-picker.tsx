'use client';

import { Popover as PopoverPrimitive } from 'radix-ui';
import { ICON_LIBRARY, type IconName } from '@/lib/constants';

interface Props {
  value: IconName;
  onChange: (name: IconName) => void;
}

export default function IconPicker({ value, onChange }: Props) {
  const Current = ICON_LIBRARY[value];

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        type="button"
        className="w-10 h-10 grid place-items-center rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
        aria-label={`Выбрать иконку (сейчас: ${value})`}
      >
        <Current className="w-5 h-5 text-amber-500" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-64 rounded-md border border-zinc-700 bg-zinc-900 p-2 shadow-lg"
          sideOffset={4}
          align="start"
        >
          <div className="grid grid-cols-6 gap-1">
            {(Object.keys(ICON_LIBRARY) as IconName[]).map((name) => {
              const I = ICON_LIBRARY[name];
              const active = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChange(name)}
                  title={name}
                  className={`w-9 h-9 grid place-items-center rounded hover:bg-zinc-800 ${
                    active ? 'bg-amber-500/20 ring-1 ring-amber-500' : ''
                  }`}
                  aria-label={name}
                  aria-pressed={active}
                >
                  <I className="w-4 h-4 text-zinc-200" />
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
