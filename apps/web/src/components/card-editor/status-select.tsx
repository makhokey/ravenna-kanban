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
  getStatusOption,
  STATUS_OPTIONS,
  type StatusOption,
  type StatusValue,
} from "~/lib/card-config";
import { StatusIcon } from "./status-icon";

type StatusSelectProps = {
  value: StatusValue | null | undefined;
  onChange: (value: StatusValue) => void;
  iconOnly?: boolean;
};

export function StatusSelect({ value, onChange, iconOnly }: StatusSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = getStatusOption(value);

  return (
    <Combobox<StatusOption>
      autoHighlight
      items={STATUS_OPTIONS}
      value={selected}
      onValueChange={(val) => onChange((val?.value ?? "backlog") as StatusValue)}
      open={open}
      onOpenChange={setOpen}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <ComboboxTrigger
              render={
                iconOnly ? (
                  <Button variant="ghost" size="icon-xs">
                    <StatusIcon status={selected.value} />
                  </Button>
                ) : (
                  <Button variant="outline" size="xs" className="gap-2">
                    <StatusIcon status={selected.value} />
                    <span>{selected.label}</span>
                  </Button>
                )
              }
            />
          }
        />
        <TooltipPopup>
          Status <Kbd>S</Kbd>
        </TooltipPopup>
      </Tooltip>
      <ComboboxPopup>
        <ComboboxInput
          className="border-0 p-2 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          showTrigger={false}
          placeholder="Set status to..."
          endAddon={<Kbd>S</Kbd>}
          onKeyDown={(e) => {
            if (["1", "2", "3", "4", "5"].includes(e.key)) {
              const option = STATUS_OPTIONS[parseInt(e.key) - 1];
              if (option) {
                e.preventDefault();
                onChange(option.value);
                setOpen(false);
              }
            }
          }}
        />
        <ComboboxSeparator />
        <ComboboxEmpty>No status found.</ComboboxEmpty>
        <ComboboxList className="w-full">
          {(item: StatusOption) => (
            <ComboboxItem className="w-full" key={item.value} value={item}>
              <StatusIcon status={item.value} className="size-3" />
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
