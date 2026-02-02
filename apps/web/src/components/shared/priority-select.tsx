import { Button } from "@repo/ui/components/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@repo/ui/components/combobox";
import { Kbd } from "@repo/ui/components/kbd";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useState } from "react";
import {
  getPriorityOption,
  PRIORITY_OPTIONS,
  type PriorityOption,
  type PriorityValue,
} from "./card-schema";

type PrioritySelectProps = {
  value: PriorityValue;
  onChange: (value: PriorityValue) => void;
};

export function PrioritySelect({ value, onChange }: PrioritySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = getPriorityOption(value);
  const Icon = selected.icon;

  return (
    <Combobox<PriorityOption>
      autoHighlight
      items={PRIORITY_OPTIONS}
      value={selected}
      onValueChange={(val) => onChange((val?.value ?? "no priority") as PriorityValue)}
      open={open}
      onOpenChange={setOpen}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <ComboboxTrigger
              render={
                <Button variant="outline" size="xs" className="gap-2">
                  <Icon />
                  <span>
                    {selected.value !== "no priority" ? selected.label : "Priority"}
                  </span>
                </Button>
              }
            />
          }
        />
        <TooltipPopup>
          Priority <Kbd>P</Kbd>
        </TooltipPopup>
      </Tooltip>
      <ComboboxPopup>
        <ComboboxInput
          className="border-0 p-2 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          showTrigger={false}
          placeholder="Set priority to..."
          endAddon={<Kbd>P</Kbd>}
          onKeyDown={(e) => {
            if (["0", "1", "2", "3"].includes(e.key)) {
              const option = PRIORITY_OPTIONS[parseInt(e.key)];
              if (option) {
                e.preventDefault();
                onChange(option.value);
                setOpen(false);
              }
            }
          }}
        />
        <ComboboxSeparator />
        <ComboboxEmpty>No priority found.</ComboboxEmpty>
        <ComboboxList className="w-full">
          {(item: PriorityOption) => (
            <ComboboxItem className="w-full" key={item.value} value={item}>
              <item.icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              <ComboboxItemIndicator />
              <Kbd>{item.shortcut}</Kbd>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
